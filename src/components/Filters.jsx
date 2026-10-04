// src/components/Filters.jsx
import { useLanguage } from "../context/LanguageContext.jsx";
import { FaGlobeAmericas, FaUtensils, FaChartBar, FaClock, FaTags, FaLeaf, FaDumbbell } from "react-icons/fa";
import { GiBroccoli, GiWheat, GiMoon } from "react-icons/gi";

const DIET_TAG_ICONS = {
  vegetarian: GiBroccoli,
  vegan: FaLeaf,
  glutenFree: GiWheat,
  halal: GiMoon,
};

const DIFFICULTIES = ["Oson", "O'rta", "Qiyin"];
const TIME_OPTIONS = [
  { value: "30", labelKey: "filters.time30" },
  { value: "60", labelKey: "filters.time60" },
  { value: "120", labelKey: "filters.time120" },
];
const DIET_TAG_OPTIONS = ["vegetarian", "vegan", "glutenFree", "halal"];

function Filters({
  countries,
  categories,
  selectedCountry,
  selectedCategory,
  onCountryChange,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedMaxTime,
  onMaxTimeChange,
  selectedDietTags,
  onToggleDietTag,
  lowCalorie,
  onToggleLowCalorie,
  highProtein,
  onToggleHighProtein,
}) {
  const { t, translateDifficulty } = useLanguage();

  return (
    <div className="filters">
      <div className="filter-group">
        <label className="filter-label">
          <FaGlobeAmericas /> {t("filters.country")}
        </label>
        <div className="filter-pills">
          <button
            className={`filter-pill ${selectedCountry === "" ? "active" : ""}`}
            onClick={() => onCountryChange("")}
          >
            {t("filters.all")}
          </button>
          {countries.map((c) => (
            <button
              key={c}
              className={`filter-pill ${
                selectedCountry === c ? "active" : ""
              }`}
              onClick={() => onCountryChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <FaUtensils /> {t("filters.category")}
        </label>
        <div className="filter-pills">
          <button
            className={`filter-pill ${
              selectedCategory === "" ? "active" : ""
            }`}
            onClick={() => onCategoryChange("")}
          >
            {t("filters.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`filter-pill ${
                selectedCategory === c ? "active" : ""
              }`}
              onClick={() => onCategoryChange(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <FaChartBar /> {t("filters.difficulty")}
        </label>
        <div className="filter-pills">
          <button
            className={`filter-pill ${selectedDifficulty === "" ? "active" : ""}`}
            onClick={() => onDifficultyChange("")}
          >
            {t("filters.all")}
          </button>
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={`filter-pill ${selectedDifficulty === d ? "active" : ""}`}
              onClick={() => onDifficultyChange(d)}
            >
              {translateDifficulty(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <FaClock /> {t("filters.time")}
        </label>
        <div className="filter-pills">
          <button
            className={`filter-pill ${selectedMaxTime === "" ? "active" : ""}`}
            onClick={() => onMaxTimeChange("")}
          >
            {t("filters.all")}
          </button>
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`filter-pill ${selectedMaxTime === opt.value ? "active" : ""}`}
              onClick={() => onMaxTimeChange(opt.value)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">
          <FaTags /> {t("filters.dietTags")}
        </label>
        <div className="filter-pills">
          {DIET_TAG_OPTIONS.map((tag) => {
            const TagIcon = DIET_TAG_ICONS[tag];
            return (
              <button
                key={tag}
                className={`filter-pill ${selectedDietTags.includes(tag) ? "active" : ""}`}
                onClick={() => onToggleDietTag(tag)}
              >
                {TagIcon && <TagIcon />} {t(`dietTags.${tag}`)}
              </button>
            );
          })}
          <button
            className={`filter-pill ${lowCalorie ? "active" : ""}`}
            onClick={onToggleLowCalorie}
          >
            <FaLeaf /> {t("filters.lowCalorie")}
          </button>
          <button
            className={`filter-pill ${highProtein ? "active" : ""}`}
            onClick={onToggleHighProtein}
          >
            <FaDumbbell /> {t("filters.highProtein")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Filters;
