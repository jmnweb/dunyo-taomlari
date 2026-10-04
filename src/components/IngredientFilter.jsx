// src/components/IngredientFilter.jsx
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Icons from "../utils/icons.jsx";

function IngredientFilter({ allIngredients, popularIngredients, selected, onChange }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  // Hali tanlanmagan va kiritilgan matnga mos keladigan ingredientlar ro'yxati
  const suggestions =
    query.trim().length > 0
      ? allIngredients
          .filter(
            (name) =>
              name.toLowerCase().includes(query.toLowerCase()) &&
              !selected.includes(name)
          )
          .slice(0, 8)
      : [];

  function addIngredient(name) {
    onChange([...selected, name]);
    setQuery("");
  }

  function removeIngredient(name) {
    onChange(selected.filter((i) => i !== name));
  }

  const visiblePopular = (popularIngredients || []).filter((name) => !selected.includes(name));

  return (
    <div className="ingredient-filter">
      <label className="filter-label">{t("filters.ingredients")}</label>

      <div className="ingredient-filter-input-wrap">
        <input
          type="text"
          className="form-input ingredient-filter-input"
          placeholder={t("filters.ingredientPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="ingredient-suggestions">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                className="ingredient-suggestion"
                onClick={() => addIngredient(name)}
              >
                + {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {visiblePopular.length > 0 && (
        <div className="ingredient-popular">
          <span className="ingredient-popular-label">{t("filters.popularIngredients")}</span>
          <div className="ingredient-popular-pills">
            {visiblePopular.map((name) => (
              <button
                key={name}
                type="button"
                className="ingredient-popular-pill"
                onClick={() => addIngredient(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="ingredient-chips">
          {selected.map((name, i) => (
            <span key={name} className="ingredient-chip">
              {i > 0 && <span className="ingredient-chip-and">{t("filters.and")}</span>}
              {name}
              <button
                type="button"
                className="ingredient-chip-remove"
                onClick={() => removeIngredient(name)}
              >
                <Icons.clear />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default IngredientFilter;
