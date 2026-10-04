// src/components/RecipeForm.jsx
// Retsept qo'shish va tahrirlash uchun umumiy forma komponenti.

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Icons from "../utils/icons.jsx";

const EMPTY_INGREDIENT = { name: "", amount: "", grams: "" };

function RecipeForm({ initialData, onSubmit, submitLabel }) {
  const { t } = useLanguage();

  const [title, setTitle] = useState(initialData?.title || "");
  const [image, setImage] = useState(initialData?.image || "");
  const [country, setCountry] = useState(initialData?.country || "");
  const [flag, setFlag] = useState(initialData?.flag || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [cookingTime, setCookingTime] = useState(initialData?.cookingTime || "");
  const [servings, setServings] = useState(initialData?.servings || 4);
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "Oson");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [calories, setCalories] = useState(initialData?.nutrition?.calories || "");
  const [protein, setProtein] = useState(initialData?.nutrition?.protein || "");
  const [carbs, setCarbs] = useState(initialData?.nutrition?.carbs || "");
  const [fat, setFat] = useState(initialData?.nutrition?.fat || "");
  const [dietTags, setDietTags] = useState(initialData?.dietTags || []);

  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length ? initialData.ingredients : [{ ...EMPTY_INGREDIENT }]
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions?.length ? initialData.instructions : [""]
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateIngredient(index, field, value) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function addIngredientRow() {
    setIngredients([...ingredients, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredientRow(index) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateInstruction(index, value) {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  }

  function addInstructionRow() {
    setInstructions([...instructions, ""]);
  }

  function removeInstructionRow(index) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  function toggleDietTag(tag) {
    setDietTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title || !country || !category || !cookingTime) {
      return setError(t("form.requiredFields"));
    }

    const cleanIngredients = ingredients.filter((i) => i.name.trim());
    const cleanInstructions = instructions.filter((s) => s.trim());

    if (cleanIngredients.length === 0) {
      return setError(t("form.needIngredient"));
    }
    if (cleanInstructions.length === 0) {
      return setError(t("form.needStep"));
    }

    setSaving(true);
    try {
      await onSubmit({
        title,
        image: image || "https://loremflickr.com/700/500/" + encodeURIComponent(title) + ",food",
        country,
        flag,
        category,
        description,
        cookingTime,
        servings: Number(servings) || 1,
        difficulty,
        videoUrl: videoUrl.trim(),
        dietTags,
        nutrition:
          calories || protein || carbs || fat
            ? {
                calories: Number(calories) || 0,
                protein: Number(protein) || 0,
                carbs: Number(carbs) || 0,
                fat: Number(fat) || 0,
              }
            : null,
        ingredients: cleanIngredients,
        instructions: cleanInstructions,
      });
    } catch (err) {
      setError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("form.title")}</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("form.titlePlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("form.image")}</label>
          <input className="form-input" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("form.country")}</label>
          <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t("form.countryPlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("form.flag")}</label>
          <input className="form-input" value={flag} onChange={(e) => setFlag(e.target.value)} placeholder="🇺🇿" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("form.category")}</label>
          <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("form.categoryPlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("form.difficulty")}</label>
          <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="Oson">{t("difficulty.Oson")}</option>
            <option value="O'rta">{t("difficulty.O'rta")}</option>
            <option value="Qiyin">{t("difficulty.Qiyin")}</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.description")}</label>
        <textarea
          className="form-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("form.descriptionPlaceholder")}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t("form.cookingTime")}</label>
          <input className="form-input" value={cookingTime} onChange={(e) => setCookingTime(e.target.value)} placeholder={t("form.cookingTimePlaceholder")} />
        </div>
        <div className="form-group">
          <label className="form-label">{t("form.servings")}</label>
          <input type="number" min="1" className="form-input" value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.videoUrl")}</label>
        <input
          className="form-input"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.nutritionTitle")}</label>
        <p className="form-hint">{t("form.nutritionHint")}</p>
        <div className="form-row form-row-4">
          <div className="form-group">
            <label className="form-label form-label-small">{t("form.calories")}</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="450"
            />
          </div>
          <div className="form-group">
            <label className="form-label form-label-small">{t("form.protein")}</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="20"
            />
          </div>
          <div className="form-group">
            <label className="form-label form-label-small">{t("form.carbs")}</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="50"
            />
          </div>
          <div className="form-group">
            <label className="form-label form-label-small">{t("form.fat")}</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="15"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.dietTagsTitle")}</label>
        <div className="filter-pills">
          {["vegetarian", "vegan", "glutenFree", "halal"].map((tag) => (
            <button
              key={tag}
              type="button"
              className={`filter-pill ${dietTags.includes(tag) ? "active" : ""}`}
              onClick={() => toggleDietTag(tag)}
            >
              {t(`dietTags.${tag}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.ingredients")}</label>
        {ingredients.map((ing, i) => (
          <div className="dynamic-row" key={i}>
            <input
              className="form-input"
              placeholder={t("form.ingredientNamePlaceholder")}
              value={ing.name}
              onChange={(e) => updateIngredient(i, "name", e.target.value)}
            />
            <input
              className="form-input dynamic-row-small"
              placeholder={t("form.ingredientAmountPlaceholder")}
              value={ing.amount}
              onChange={(e) => updateIngredient(i, "amount", e.target.value)}
            />
            <input
              type="number"
              min="0"
              className="form-input dynamic-row-grams"
              placeholder={t("form.ingredientGramsPlaceholder")}
              value={ing.grams}
              onChange={(e) => updateIngredient(i, "grams", e.target.value)}
            />
            {ingredients.length > 1 && (
              <button type="button" className="dynamic-row-remove" onClick={() => removeIngredientRow(i)}>
                <Icons.clear />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="dynamic-add-btn" onClick={addIngredientRow}>
          {t("form.addIngredient")}
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">{t("form.instructions")}</label>
        {instructions.map((step, i) => (
          <div className="dynamic-row" key={i}>
            <span className="dynamic-row-number">{i + 1}</span>
            <input
              className="form-input"
              placeholder={t("form.stepPlaceholder", { n: i + 1 })}
              value={step}
              onChange={(e) => updateInstruction(i, e.target.value)}
            />
            {instructions.length > 1 && (
              <button type="button" className="dynamic-row-remove" onClick={() => removeInstructionRow(i)}>
                <Icons.clear />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="dynamic-add-btn" onClick={addInstructionRow}>
          {t("form.addStep")}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="auth-submit" disabled={saving}>
        {saving ? t("form.saving") : submitLabel}
      </button>
    </form>
  );
}

export default RecipeForm;
