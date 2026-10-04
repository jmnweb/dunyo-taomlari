// src/pages/MyRecipes.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { getMyRecipes, deleteRecipe } from "../api.js";
import RecipeCard from "../components/RecipeCard.jsx";
import Icons from "../utils/icons.jsx";

function MyRecipes() {
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
    getMyRecipes()
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, [user, lang]);

  async function handleDelete(recipeId) {
    if (!confirm(t("myRecipes.confirmDelete"))) return;
    await deleteRecipe(recipeId);
    setRecipes(recipes.filter((r) => r.id !== recipeId));
  }

  if (checkingSession || !user || loading) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">{t("myRecipes.title")}</h1>
        <p className="hero-subtitle">{t("myRecipes.subtitle")}</p>
        <Link to="/add-recipe" className="navbar-btn navbar-btn-filled">
          {t("myRecipes.addNew")}
        </Link>
      </section>

      {recipes.length === 0 ? (
        <div className="state-message">{t("myRecipes.empty")}</div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="my-recipe-item">
              <RecipeCard recipe={recipe} />
              <span
                className={`recipe-status-badge ${
                  recipe.status === "pending" ? "status-pending" : "status-published"
                }`}
              >
                {recipe.status === "pending" ? (
                  <>
                    <Icons.hourglass /> {t("myRecipes.statusPending")}
                  </>
                ) : (
                  t("myRecipes.statusPublished")
                )}
              </span>
              <div className="my-recipe-actions">
                <Link to={`/edit-recipe/${recipe.id}`} className="navbar-btn navbar-btn-outline">
                  {t("detail.edit")}
                </Link>
                <button className="navbar-btn navbar-btn-danger" onClick={() => handleDelete(recipe.id)}>
                  {t("detail.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyRecipes;
