// src/pages/RecipeDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getRecipeById, getReviews, postReview, deleteReview, deleteRecipe, getSimilarRecipes } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import StarRating from "../components/StarRating.jsx";
import FavoriteButton from "../components/FavoriteButton.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import MacroChart from "../components/MacroChart.jsx";
import { getYouTubeEmbedUrl } from "../utils/youtube.js";
import { scaleAmount, scaleNutrient, isPlainGrams } from "../utils/scaling.js";
import { addRecentlyViewed } from "../utils/recentlyViewed.js";
import { handleImageError } from "../utils/imageFallback.js";
import {
  FaArrowLeft,
  FaUser,
  FaVideo,
  FaUtensils,
  FaComments,
  FaChartLine,
  FaClock,
  FaChartBar,
} from "react-icons/fa";
import { GiSaltShaker, GiChefToque } from "react-icons/gi";

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, translateDifficulty, lang } = useLanguage();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [similarRecipes, setSimilarRecipes] = useState([]);
  const [currentServings, setCurrentServings] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  function loadRecipe() {
    setLoading(true);
    getRecipeById(id)
      .then((data) => {
        setRecipe(data);
        setCurrentServings(data.servings);
        addRecentlyViewed(data.id);
      })
      .catch(() => setError(t("detail.notFound")))
      .finally(() => setLoading(false));
  }

  function loadReviews() {
    getReviews(id).then((data) => {
      setReviews(data);
      if (user) {
        const mine = data.find((r) => r.userId === user.id);
        if (mine) {
          setMyRating(mine.rating);
          setMyComment(mine.comment);
        }
      }
    });
  }

  useEffect(() => {
    loadRecipe();
    loadReviews();
    getSimilarRecipes(id)
      .then(setSimilarRecipes)
      .catch(() => setSimilarRecipes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, lang]);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError("");

    if (!user) {
      navigate("/login");
      return;
    }
    if (myRating === 0) {
      return setReviewError(t("detail.ratingRequired"));
    }

    setSavingReview(true);
    try {
      await postReview(id, { rating: myRating, comment: myComment });
      loadReviews();
      loadRecipe();
    } catch (err) {
      setReviewError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setSavingReview(false);
    }
  }

  async function handleReviewDelete(reviewId) {
    await deleteReview(reviewId);
    setMyRating(0);
    setMyComment("");
    loadReviews();
    loadRecipe();
  }

  async function handleRecipeDelete() {
    if (!confirm(t("detail.confirmDeleteRecipe"))) return;
    await deleteRecipe(id);
    navigate("/");
  }

  if (loading) return <div className="state-message">{t("home.loading")}</div>;
  if (error || !recipe)
    return (
      <div className="state-message">
        {error || t("detail.notFound")}
        <br />
        <Link to="/" className="back-link">
          <FaArrowLeft /> {t("detail.backHome")}
        </Link>
      </div>
    );

  const isOwner = user && recipe.createdBy === user.id;
  const servingFactor = recipe.servings ? currentServings / recipe.servings : 1;

  function adjustServings(delta) {
    setCurrentServings((prev) => Math.max(1, prev + delta));
  }

  return (
    <main className="recipe-detail">
      <Link to="/recipes" className="back-link">
        <FaArrowLeft /> {t("detail.backToAll")}
      </Link>

      <div className="detail-hero">
        <div className="detail-image-wrap">
          <img src={recipe.image} alt={recipe.title} className="detail-image" onError={handleImageError} />
          <FavoriteButton recipeId={recipe.id} className="detail-favorite" />
        </div>

        <div className="detail-hero-info">
          <span className="detail-country">
            {recipe.flag} {recipe.country} · {recipe.category}
          </span>
          <h1 className="detail-title">{recipe.title}</h1>

          {recipe.dietTags && recipe.dietTags.length > 0 && (
            <div className="recipe-card-diet-tags detail-diet-tags">
              {recipe.dietTags.map((tag) => (
                <span key={tag} className="diet-tag-badge">
                  {t(`dietTags.${tag}`)}
                </span>
              ))}
            </div>
          )}

          <div className="detail-rating-row">
            <StarRating rating={recipe.averageRating} size="1.1rem" />
            <span className="recipe-card-rating-text">
              {recipe.averageRating > 0 ? recipe.averageRating : t("card.notRated")}
              {recipe.reviewCount > 0 && ` (${recipe.reviewCount})`}
            </span>
          </div>

          <p className="detail-description">{recipe.description}</p>

          <div className="detail-stats">
            <div className="detail-stat">
              <span className="detail-stat-label">
                <FaClock /> {t("detail.time")}
              </span>
              <span className="detail-stat-value">{recipe.cookingTime}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">
                <FaUtensils /> {t("detail.servings")}
              </span>
              <div className="servings-stepper">
                <button
                  type="button"
                  className="servings-stepper-btn"
                  onClick={() => adjustServings(-1)}
                  disabled={currentServings <= 1}
                >
                  −
                </button>
                <span className="detail-stat-value">
                  {currentServings} {t("detail.servingsUnit")}
                </span>
                <button
                  type="button"
                  className="servings-stepper-btn"
                  onClick={() => adjustServings(1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">
                <FaChartBar /> {t("detail.difficulty")}
              </span>
              <span className="detail-stat-value">{translateDifficulty(recipe.difficulty)}</span>
            </div>
          </div>

          {recipe.createdByName && (
            <p className="detail-author">
              <FaUser /> {t("detail.author")} {recipe.createdByName}
            </p>
          )}

          {isOwner && (
            <div className="detail-owner-actions">
              <Link to={`/edit-recipe/${recipe.id}`} className="navbar-btn navbar-btn-outline">
                {t("detail.edit")}
              </Link>
              <button className="navbar-btn navbar-btn-danger" onClick={handleRecipeDelete}>
                {t("detail.delete")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="detail-content">
        <section className="detail-section">
          <h2 className="detail-section-title">
            <GiSaltShaker /> {t("detail.ingredientsTitle")}
          </h2>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="ingredients-item">
                <span>{ing.name}</span>
                <span className="ingredients-amount">
                  {scaleAmount(ing.amount, servingFactor)}
                  {ing.grams != null && !isPlainGrams(ing.amount) && (
                    <span className="ingredients-grams">
                      {" "}
                      (≈{scaleNutrient(ing.grams, servingFactor)} g)
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="detail-section">
          <h2 className="detail-section-title">
            <GiChefToque /> {t("detail.instructionsTitle")}
          </h2>
          <ol className="steps-list">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="steps-item">
                <span className="steps-number">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.nutrition && (
        <section className="nutrition-section">
          <h2 className="detail-section-title">
            <FaChartLine /> {t("detail.nutritionTitle")}
          </h2>
          <p className="nutrition-note">{t("detail.nutritionNote")}</p>
          <div className="nutrition-grid">
            <div className="nutrition-box">
              <span className="nutrition-value">{scaleNutrient(recipe.nutrition.calories, servingFactor)}</span>
              <span className="nutrition-label">{t("detail.calories")}</span>
              <span className="nutrition-daily">
                {t("detail.dailyValue", {
                  percent: Math.round((scaleNutrient(recipe.nutrition.calories, servingFactor) / 2000) * 100),
                })}
              </span>
            </div>
            <div className="nutrition-box">
              <span className="nutrition-value">{scaleNutrient(recipe.nutrition.protein, servingFactor)} g</span>
              <span className="nutrition-label">{t("detail.protein")}</span>
            </div>
            <div className="nutrition-box">
              <span className="nutrition-value">{scaleNutrient(recipe.nutrition.carbs, servingFactor)} g</span>
              <span className="nutrition-label">{t("detail.carbs")}</span>
            </div>
            <div className="nutrition-box">
              <span className="nutrition-value">{scaleNutrient(recipe.nutrition.fat, servingFactor)} g</span>
              <span className="nutrition-label">{t("detail.fat")}</span>
            </div>
          </div>

          <MacroChart
            protein={recipe.nutrition.protein}
            carbs={recipe.nutrition.carbs}
            fat={recipe.nutrition.fat}
          />
        </section>
      )}

      {getYouTubeEmbedUrl(recipe.videoUrl) && (
        <section className="detail-section video-section">
          <h2 className="detail-section-title">
            <FaVideo /> {t("detail.videoTitle")}
          </h2>
          <div className="video-embed-wrap">
            <iframe
              src={getYouTubeEmbedUrl(recipe.videoUrl)}
              title={recipe.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {similarRecipes.length > 0 && (
        <section className="similar-section">
          <h2 className="detail-section-title">
            <FaUtensils /> {t("detail.similarTitle")}
          </h2>
          <div className="similar-scroll">
            {similarRecipes.map((r) => (
              <div className="similar-card-wrap" key={r.id}>
                <RecipeCard recipe={r} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="reviews-section">
        <h2 className="detail-section-title">
          <FaComments /> {t("detail.reviewsTitle")}
        </h2>

        <form className="review-form" onSubmit={handleReviewSubmit}>
          <p className="form-label">{t("detail.yourRating")}</p>
          <StarRating rating={myRating} onRate={setMyRating} size="1.6rem" />
          <textarea
            className="form-input"
            rows={3}
            placeholder={user ? t("detail.commentLoggedIn") : t("detail.commentLoggedOut")}
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
          />
          {reviewError && <p className="form-error">{reviewError}</p>}
          <button type="submit" className="auth-submit review-submit" disabled={savingReview}>
            {savingReview ? t("detail.sending") : user ? t("detail.submitReview") : t("detail.loginToReview")}
          </button>
        </form>

        <div className="reviews-list">
          {reviews.length === 0 && (
            <p className="reviews-empty">{t("detail.noReviews")}</p>
          )}
          {reviews.map((review) => (
            <div className="review-item" key={review.id}>
              <div className="review-item-top">
                <span className="review-author">
                  <FaUser /> {review.userName}
                </span>
                <StarRating rating={review.rating} size="0.85rem" />
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
              {user && review.userId === user.id && (
                <button className="review-delete" onClick={() => handleReviewDelete(review.id)}>
                  {t("detail.deleteReview")}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default RecipeDetail;
