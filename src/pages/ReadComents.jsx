// src/pages/ReadComents.jsx
// Saytdagi BARCHA foydalanuvchi komentariyalarini (baho + fikr) bir joyda ko'rsatadi.
// Har bir komentariya tagida u yozilgan retseptning rasmi va nomi chiqadi,
// bosilganda o'sha retsept sahifasiga o'tkazadi.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllComments } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import StarRating from "../components/StarRating.jsx";
import { FaUser } from "react-icons/fa";

function ReadComents() {
  const { t, lang } = useLanguage();
  const { user, checkingSession } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Faqat tizimga kirgan foydalanuvchilar ko'ra oladi — login qilmagan
  // bo'lsa, to'g'ridan-to'g'ri URL orqali kirishga urinsa ham login sahifasiga yo'naltiriladi.
  useEffect(() => {
    if (!checkingSession && !user) {
      navigate("/login");
    }
  }, [user, checkingSession, navigate]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    getAllComments()
      .then(setComments)
      .catch(() => setError(t("comments.loadError")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, user]);

  if (checkingSession || !user || loading) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  if (error) {
    return <div className="state-message error">{error}</div>;
  }

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">
          {t("comments.title")} <span className="hero-highlight">{t("comments.titleHighlight")}</span>
        </h1>
        <p className="hero-subtitle">{t("comments.subtitle")}</p>
      </section>

      {comments.length === 0 ? (
        <div className="state-message">{t("comments.empty")}</div>
      ) : (
        <div className="all-comments-list">
          {comments.map((comment) => (
            <div className="all-comment-card" key={comment.id}>
              <div className="all-comment-recipe">
                {comment.recipe ? (
                  <Link to={`/recipe/${comment.recipe.id}`} className="all-comment-recipe-link">
                    <img
                      src={comment.recipe.image}
                      alt={comment.recipe.title}
                      className="all-comment-recipe-image"
                    />
                    <span className="all-comment-recipe-title">
                      {comment.recipe.flag} {comment.recipe.title}
                    </span>
                  </Link>
                ) : (
                  <span className="all-comment-recipe-title">{t("comments.recipeDeleted")}</span>
                )}
              </div>

              <div className="all-comment-body">
                <div className="review-item-top">
                  <span className="review-author">
                    <FaUser /> {comment.userName}
                  </span>
                  <StarRating rating={comment.rating} size="0.85rem" />
                </div>
                {comment.comment && <p className="review-comment">{comment.comment}</p>}
                {comment.recipe && (
                  <Link to={`/recipe/${comment.recipe.id}`} className="all-comment-view-link">
                    {t("comments.viewRecipe")}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default ReadComents;
