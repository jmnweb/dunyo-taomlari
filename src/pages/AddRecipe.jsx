// src/pages/AddRecipe.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import RecipeForm from "../components/RecipeForm.jsx";
import { createRecipe } from "../api.js";
import Icons from "../utils/icons.jsx";

function AddRecipe() {
  const { user, checkingSession } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [submittedPending, setSubmittedPending] = useState(false);

  useEffect(() => {
    if (!checkingSession && !user) {
      navigate("/login");
    }
  }, [user, checkingSession, navigate]);

  if (checkingSession || !user) return null;

  async function handleSubmit(data) {
    const newRecipe = await createRecipe(data);

    // Admin qo'shsa — darhol chop etiladi, retsept sahifasiga o'tamiz.
    // Oddiy foydalanuvchi qo'shsa — admin tasdiqlashini kutadi.
    if (user.role === "admin") {
      navigate(`/recipe/${newRecipe.id}`);
    } else {
      setSubmittedPending(true);
    }
  }

  if (submittedPending) {
    return (
      <main className="form-page">
        <div className="pending-success">
          <span className="pending-success-icon"><Icons.hourglass /></span>
          <h1 className="form-page-title">{t("addRecipe.pendingTitle")}</h1>
          <p className="about-text">{t("addRecipe.pendingText")}</p>
          <Link to="/my-recipes" className="navbar-btn navbar-btn-filled">
            {t("addRecipe.pendingButton")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="form-page">
      <h1 className="form-page-title"><Icons.friedEgg /> {t("addRecipe.title")}</h1>
      <p className="form-page-subtitle">{t("addRecipe.subtitle")}</p>
      {user.role !== "admin" && (
        <p className="pending-notice"><Icons.info /> {t("addRecipe.pendingNotice")}</p>
      )}
      <RecipeForm onSubmit={handleSubmit} submitLabel={t("addRecipe.submit")} />
    </main>
  );
}

export default AddRecipe;
