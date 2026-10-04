// src/components/SortDropdown.jsx
import { useLanguage } from "../context/LanguageContext.jsx";

function SortDropdown({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="sort-dropdown">
      <label className="sort-dropdown-label">{t("sort.label")}</label>
      <select
        className="sort-dropdown-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("sort.default")}</option>
        <option value="rating">{t("sort.rating")}</option>
        <option value="newest">{t("sort.newest")}</option>
        <option value="time">{t("sort.time")}</option>
        <option value="calories">{t("sort.calories")}</option>
      </select>
    </div>
  );
}

export default SortDropdown;
