// src/pages/Favorites.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getFavorites } from "../api.js";
import RecipeCard from "../components/RecipeCard.jsx";

function Favorites() {
  const { user, checkingSession } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!checkingSession && !user) {
      navigate("/login");
    }
  }, [user, checkingSession, navigate]);

  useEffect(() => {
    if (!user) return;
    getFavorites()
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, [user, user?.favorites, lang]);

  if (checkingSession || !user || loading) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">{t("favorites.title")}</h1>
        <p className="hero-subtitle">{t("favorites.subtitle")}</p>
      </section>

      {recipes.length === 0 ? (
        <div className="state-message">{t("favorites.empty")}</div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Favorites;
