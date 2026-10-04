// src/components/FavoriteButton.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { addFavorite, removeFavorite } from "../api.js";
import Icons from "../utils/icons.jsx";

function FavoriteButton({ recipeId, className = "" }) {
  const { user, refreshUser } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const isFavorite = user?.favorites?.includes(recipeId);

  const tooltips = {
    uz: ["Sevimlilardan olib tashlash", "Sevimlilarga qo'shish"],
    ru: ["Убрать из избранного", "Добавить в избранное"],
    en: ["Remove from favorites", "Add to favorites"],
  };
  const [removeLabel, addLabel] = tooltips[lang] || tooltips.uz;

  async function handleClick(e) {
    e.preventDefault(); // Link ichida bo'lsa, sahifaga o'tib ketmasligi uchun
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (isFavorite) {
      await removeFavorite(recipeId);
    } else {
      await addFavorite(recipeId);
    }
    await refreshUser();
  }

  return (
    <button
      type="button"
      className={`favorite-btn ${isFavorite ? "favorite-btn-active" : ""} ${className}`}
      onClick={handleClick}
      title={isFavorite ? removeLabel : addLabel}
    >
      {isFavorite ? <Icons.heart /> : <Icons.heartOutline />}
    </button>
  );
}

export default FavoriteButton;
