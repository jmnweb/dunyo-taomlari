// src/components/PopularSection.jsx
import { useEffect, useState } from "react";
import { getRecipes } from "../api.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import PopularCard from "./PopularCard.jsx";

function PopularSection() {
  const { t, lang } = useLanguage();
  const [popularRecipes, setPopularRecipes] = useState([]);

  // Bu bo'lim asosiy qidiruv/filtrlardan mustaqil ishlaydi —
  // har doim eng mashhur taomlarni ko'rsatadi, foydalanuvchi nima qidirayotganidan qat'i nazar.
  useEffect(() => {
    getRecipes()
      .then((data) => setPopularRecipes(data.filter((r) => r.popular)))
      .catch(() => {});
  }, [lang]);

  if (popularRecipes.length === 0) return null;

  return (
    <section className="popular-section">
      <h2 className="popular-section-title">{t("home.popularTitle")}</h2>
      <div className="popular-scroll">
        {popularRecipes.map((recipe, index) => (
          <PopularCard key={recipe.id} recipe={recipe} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

export default PopularSection;
