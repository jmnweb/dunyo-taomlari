// src/pages/EditRecipe.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import RecipeForm from "../components/RecipeForm.jsx";
import { getRecipeById, updateRecipe } from "../api.js";
import Icons from "../utils/icons.jsx";

function EditRecipe() {
  const { id } = useParams();
  const { user, checkingSession } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  useEffect(() => {
    if (!checkingSession && !user) {
      navigate("/login");
    }
  }, [user, checkingSession, navigate]);

  useEffect(() => {
    if (!user) return;
    getRecipeById(id)
      .then((data) => {
        if (data.createdBy !== user.id) {
          setNotAllowed(true);
        } else {
          setRecipe(data);
        }
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  if (checkingSession || !user || loading) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  if (notAllowed) {
    return (
      <div className="state-message">
        {t("editRecipe.notAllowed")}
        <br />
        <Link to="/" className="back-link">{t("detail.backHome")}</Link>
      </div>
    );
  }

  async function handleSubmit(data) {
    await updateRecipe(id, data);
    navigate(`/recipe/${id}`);
  }

  return (
    <main className="form-page">
      <h1 className="form-page-title"><Icons.edit /> {t("editRecipe.title")}</h1>
      <RecipeForm initialData={recipe} onSubmit={handleSubmit} submitLabel={t("editRecipe.submit")} />
    </main>
  );
}

export default EditRecipe;
