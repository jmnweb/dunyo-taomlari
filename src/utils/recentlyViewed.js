// src/utils/recentlyViewed.js
// Foydalanuvchi ko'rgan retseptlar tarixini brauzerning localStorage'ida saqlaydi.
// Login talab qilinmaydi — har bir qurilma/brauzer o'z tarixini ko'radi.

const STORAGE_KEY = "recentlyViewedRecipeIds";
const MAX_ITEMS = 10;

export function addRecentlyViewed(recipeId) {
  const current = getRecentlyViewedIds().filter((id) => id !== recipeId);
  current.unshift(recipeId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage mavjud bo'lmasa (masalan maxfiy rejim), jim o'tkazib yuboramiz
  }
}

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
