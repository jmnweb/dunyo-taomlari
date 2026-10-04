// src/pages/Recipes.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import Filters from "../components/Filters.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import SortDropdown from "../components/SortDropdown.jsx";
import { getRecipes } from "../api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import { GiSaltShaker } from "react-icons/gi";
import { FaArrowRight } from "react-icons/fa";

function Recipes() {
  const { t, lang } = useLanguage();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedDietTags, setSelectedDietTags] = useState([]);
  const [lowCalorie, setLowCalorie] = useState(false);
  const [highProtein, setHighProtein] = useState(false);

  const [recipes, setRecipes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Til o'zgarganda davlat/kategoriya filtrlari boshqa tildagi matn bilan
  // mos kelmay qolishi mumkin, shuning uchun filtrlarni tozalaymiz.
  // Qiyinlik, vaqt va parhez filtrlari tilga bog'liq emas, shuning uchun ular tozalanmaydi.
  useEffect(() => {
    setCountry("");
    setCategory("");
  }, [lang]);

  function toggleDietTag(tag) {
    setSelectedDietTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Sahifa birinchi ochilganda (va til o'zgarganda) barcha retseptlarni olib,
  // davlat va kategoriya ro'yxatlarini shulardan tuzamiz.
  useEffect(() => {
    getRecipes()
      .then((data) => {
        setCountries([...new Set(data.map((r) => r.country))].sort());
        setCategories([...new Set(data.map((r) => r.category))].sort());
      })
      .catch(() => {
        // Filtr ro'yxatlarini ololmasak ham sahifa ishlashda davom etsin
      });
  }, [lang]);

  // Search yoki filterlar o'zgarganda backendga so'rov yuboramiz.
  // 300ms kutish (debounce) - foydalanuvchi yozib bo'lgach so'rov ketadi.
  useEffect(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      getRecipes({
        search,
        country,
        category,
        difficulty,
        maxTime,
        sortBy,
        dietTags: selectedDietTags,
        lowCalorie: lowCalorie || undefined,
        highProtein: highProtein || undefined,
      })
        .then((data) => setRecipes(data))
        .catch(() => setError(t("home.loadError")))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, country, category, difficulty, maxTime, sortBy, selectedDietTags, lowCalorie, highProtein, lang]);

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">
          {t("recipesPage.title")} <span className="hero-highlight">{t("recipesPage.titleHighlight")}</span>
        </h1>
        <p className="hero-subtitle">{t("recipesPage.subtitle")}</p>
        <SearchBar value={search} onChange={setSearch} />
      </section>

      <Link to="/ingredients" className="ingredient-search-banner">
        <span className="ingredient-search-banner-icon">
          <GiSaltShaker />
        </span>
        <span>
          <strong>{t("recipesPage.ingredientBannerTitle")}</strong>
          <br />
          <span className="ingredient-search-banner-text">{t("recipesPage.ingredientBannerText")}</span>
        </span>
        <span className="ingredient-search-banner-arrow">
          <FaArrowRight />
        </span>
      </Link>

      <Filters
        countries={countries}
        categories={categories}
        selectedCountry={country}
        selectedCategory={category}
        onCountryChange={setCountry}
        onCategoryChange={setCategory}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
        selectedMaxTime={maxTime}
        onMaxTimeChange={setMaxTime}
        selectedDietTags={selectedDietTags}
        onToggleDietTag={toggleDietTag}
        lowCalorie={lowCalorie}
        onToggleLowCalorie={() => setLowCalorie((v) => !v)}
        highProtein={highProtein}
        onToggleHighProtein={() => setHighProtein((v) => !v)}
      />

      <section className="results-info">
        {!loading && !error && (
          <div className="results-info-row">
            <p>
              {t("home.resultsFound", { count: recipes.length })}
              {search && t("home.resultsFoundFor", { search })}
            </p>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        )}
      </section>

      {loading && <div className="state-message">{t("home.loading")}</div>}
      {error && <div className="state-message error">{error}</div>}

      {!loading && !error && recipes.length === 0 && (
        <div className="state-message">{t("home.notFound")}</div>
      )}

      {!loading && !error && recipes.length > 0 && (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Recipes;
