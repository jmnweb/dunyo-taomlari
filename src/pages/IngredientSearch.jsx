// src/pages/IngredientSearch.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import IngredientFilter from "../components/IngredientFilter.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import { getRecipes } from "../api.js";
import { useLanguage } from "../context/LanguageContext.jsx";

function IngredientSearch() {
  const { t, lang } = useLanguage();

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [popularIngredients, setPopularIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Til o'zgarganda tanlangan ingredientlar boshqa tildagi matn bilan
  // mos kelmay qolishi mumkin, shuning uchun tozalaymiz.
  useEffect(() => {
    setSelectedIngredients([]);
  }, [lang]);

  // Sahifa birinchi ochilganda (va til o'zgarganda) barcha retseptlarni olib,
  // ulardagi ingredientlarni chastotasiga qarab saralab chiqamiz.
  useEffect(() => {
    getRecipes()
      .then((data) => {
        const frequency = {};
        data.forEach((r) => {
          r.ingredients.forEach((ing) => {
            const name = ing.name.trim();
            frequency[name] = (frequency[name] || 0) + 1;
          });
        });
        const sortedByFrequency = Object.entries(frequency)
          .sort((a, b) => b[1] - a[1])
          .map(([name]) => name);

        setAllIngredients([...sortedByFrequency].sort());
        setPopularIngredients(sortedByFrequency.slice(0, 25));
      })
      .catch(() => {
        // Ro'yxatni ololmasak ham sahifa ishlashda davom etsin
      });
  }, [lang]);

  // Tanlangan ingredientlar o'zgarganda mos retseptlarni qidiramiz
  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getRecipes({ ingredients: selectedIngredients })
      .then((data) => setRecipes(data))
      .catch(() => setError(t("home.loadError")))
      .finally(() => setLoading(false));
  }, [selectedIngredients, lang]);

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">
          {t("ingredientPage.title")} <span className="hero-highlight">{t("ingredientPage.titleHighlight")}</span>
        </h1>
        <p className="hero-subtitle">{t("ingredientPage.subtitle")}</p>
      </section>

      <IngredientFilter
        allIngredients={allIngredients}
        popularIngredients={popularIngredients}
        selected={selectedIngredients}
        onChange={setSelectedIngredients}
      />

      {selectedIngredients.length === 0 && (
        <div className="state-message">{t("ingredientPage.emptyState")}</div>
      )}

      {selectedIngredients.length > 0 && (
        <section className="results-info">
          <p>{t("home.resultsFound", { count: recipes.length })}</p>
        </section>
      )}

      {loading && <div className="state-message">{t("home.loading")}</div>}
      {error && <div className="state-message error">{error}</div>}

      {!loading && !error && selectedIngredients.length > 0 && recipes.length === 0 && (
        <div className="state-message">{t("home.notFound")}</div>
      )}

      {!loading && !error && recipes.length > 0 && (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

      <p className="ingredient-page-back">
        <Link to="/recipes" className="back-link">
          {t("ingredientPage.backToRecipes")}
        </Link>
      </p>
    </main>
  );
}

export default IngredientSearch;
