// src/components/RecentlyViewedSection.jsx
import { useEffect, useState } from "react";
import { getRecipeById } from "../api.js";
import { getRecentlyViewedIds } from "../utils/recentlyViewed.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import PopularCard from "./PopularCard.jsx";

function RecentlyViewedSection() {
  const { t, lang } = useLanguage();
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    const ids = getRecentlyViewedIds();
    if (ids.length === 0) {
      setRecipes([]);
      return;
    }

    // Har bir ID uchun retseptni alohida so'raymiz; o'chirilgan yoki
    // hali tasdiqlanmagan retseptlar bo'lsa, ularni jim o'tkazib yuboramiz
    Promise.allSettled(ids.map((id) => getRecipeById(id))).then((results) => {
      const found = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      setRecipes(found);
    });
  }, [lang]);

  if (recipes.length === 0) return null;

  return (
    <section className="popular-section">
      <h2 className="popular-section-title">{t("home.recentlyViewedTitle")}</h2>
      <div className="popular-scroll">
        {recipes.map((recipe) => (
          <PopularCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}

export default RecentlyViewedSection;
