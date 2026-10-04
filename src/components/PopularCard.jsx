// src/components/PopularCard.jsx
import { Link } from "react-router-dom";
import StarRating from "./StarRating.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { handleImageError } from "../utils/imageFallback.js";

function PopularCard({ recipe, rank }) {
  const { t } = useLanguage();

  return (
    <Link to={`/recipe/${recipe.id}`} className="popular-card">
      {rank != null && <span className="popular-card-rank">{rank}</span>}
      <div className="popular-card-image-wrap">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="popular-card-image"
          loading="lazy"
          onError={handleImageError}
        />
      </div>
      <div className="popular-card-body">
        <span className="popular-card-country">
          {recipe.flag} {recipe.country}
        </span>
        <h3 className="popular-card-title">{recipe.title}</h3>
        <div className="popular-card-rating">
          <StarRating rating={recipe.averageRating} size="0.75rem" />
          <span className="recipe-card-rating-text">
            {recipe.averageRating > 0 ? recipe.averageRating : t("card.notRated")}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default PopularCard;
