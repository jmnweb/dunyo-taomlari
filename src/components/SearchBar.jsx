// src/components/SearchBar.jsx
import { useLanguage } from "../context/LanguageContext.jsx";
import Icons from "../utils/icons.jsx";

function SearchBar({ value, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="search-bar">
      <span className="search-bar-icon"><Icons.search /></span>
      <input
        type="text"
        className="search-bar-input"
        placeholder={t("home.searchPlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="search-bar-clear" onClick={() => onChange("")}>
          <Icons.clear />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
