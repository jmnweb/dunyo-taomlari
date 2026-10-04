// src/components/RecipeCard.jsx
import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import FavoriteButton from "./FavoriteButton.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { handleImageError } from "../utils/imageFallback.js";
import Icons from "../utils/icons.jsx";

const difficultyColor = {
  Oson: "difficulty-easy",
  "O'rta": "difficulty-medium",
  Qiyin: "difficulty-hard",
};

function RecipeCard({ recipe }) {
  const { t, translateDifficulty } = useLanguage();

  return (
    <div className="recipe-card">
      <div className="recipe-card-image-wrap">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-card-image"
          loading="lazy"
          onError={handleImageError}
        />
        <span className="recipe-card-stamp">
          {recipe.flag} {recipe.country}
        </span>
        <FavoriteButton recipeId={recipe.id} className="recipe-card-favorite" />
      </div>

      <div className="recipe-card-body">
        <div className="recipe-card-top-row">
          <span className="recipe-card-category">{recipe.category}</span>
          <span
            className={`recipe-card-difficulty ${
              difficultyColor[recipe.difficulty] || ""
            }`}
          >
            {translateDifficulty(recipe.difficulty)}
          </span>
        </div>

        <h3 className="recipe-card-title">{recipe.title}</h3>

        {recipe.dietTags && recipe.dietTags.length > 0 && (
          <div className="recipe-card-diet-tags">
            {recipe.dietTags.map((tag) => (
              <span key={tag} className="diet-tag-badge">
                {t(`dietTags.${tag}`)}
              </span>
            ))}
          </div>
        )}

        <div className="recipe-card-rating">
          <StarRating rating={recipe.averageRating} size="0.85rem" />
          <span className="recipe-card-rating-text">
            {recipe.averageRating > 0 ? recipe.averageRating : t("card.notRated")}
            {recipe.reviewCount > 0 && ` (${recipe.reviewCount})`}
          </span>
        </div>

        <p className="recipe-card-description">{recipe.description}</p>

        <div className="recipe-card-footer">
          <span className="recipe-card-time">
            <Icons.clock /> {recipe.cookingTime}
            {recipe.videoUrl && <span className="recipe-card-video-badge"> <Icons.video /></span>}
          </span>
          <Link to={`/recipe/${recipe.id}`} className="recipe-card-btn">
            {t("card.viewRecipe")} <Icons.arrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;
