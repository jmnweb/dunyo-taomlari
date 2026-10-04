// src/api.js
// Backend bilan ishlash uchun barcha axios so'rovlari shu yerda jamlangan.

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

// Har bir so'rovga, agar localStorage'da token bo'lsa, uni avtomatik qo'shib yuboramiz.
// Shuningdek, joriy tanlangan tilni ham (?lang=ru kabi) avtomatik qo'shamiz —
// shunda retseptlar backenddan to'g'ridan-to'g'ri tanlangan tilda qaytadi.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const lang = localStorage.getItem("lang") || "uz";
  config.params = { ...config.params, lang };

  return config;
});

// --- Autentifikatsiya (telefon raqami bilan) ---

// Ro'yxatdan o'tish: { name, phone, password }
export const registerUser = (data) => {
  return api.post("/register", data).then((res) => res.data);
};

// Kirish: { phone, password }
export const loginUser = (data) => {
  return api.post("/login", data).then((res) => res.data);
};

// Joriy foydalanuvchini token orqali olish (sahifa yangilanganda "eslab qolish" uchun)
export const getMe = () => {
  return api.get("/me").then((res) => res.data);
};

// Chiqish
export const logoutUser = () => {
  return api.post("/logout").then((res) => res.data);
};

// --- Profil sozlamalari ---

// data = { name, phone }
export const updateProfileRequest = (data) => {
  return api.patch("/profile", data).then((res) => res.data);
};

// data = { currentPassword, newPassword }
export const changePasswordRequest = (data) => {
  return api.post("/profile/change-password", data).then((res) => res.data);
};

// avatarDataUrl = "data:image/png;base64,..."
export const uploadAvatarRequest = (avatarDataUrl) => {
  return api.post("/profile/avatar", { avatar: avatarDataUrl }).then((res) => res.data);
};

export const removeAvatarRequest = () => {
  return api.delete("/profile/avatar").then((res) => res.data);
};

// password = joriy parol (tasdiqlash uchun)
export const deleteAccountRequest = (password) => {
  return api.delete("/profile", { data: { password } }).then((res) => res.data);
};

// --- Sevimlilar (Favorites) ---

export const getFavorites = () => {
  return api.get("/favorites").then((res) => res.data);
};

export const addFavorite = (recipeId) => {
  return api.post(`/favorites/${recipeId}`).then((res) => res.data);
};

export const removeFavorite = (recipeId) => {
  return api.delete(`/favorites/${recipeId}`).then((res) => res.data);
};

// --- Sharh va baholar (Reviews & Ratings) ---

export const getReviews = (recipeId) => {
  return api.get(`/recipes/${recipeId}/reviews`).then((res) => res.data);
};

// data = { rating, comment }
export const postReview = (recipeId, data) => {
  return api.post(`/recipes/${recipeId}/reviews`, data).then((res) => res.data);
};

export const deleteReview = (reviewId) => {
  return api.delete(`/reviews/${reviewId}`).then((res) => res.data);
};

// Saytdagi BARCHA komentariyalarni (qaysi retseptga tegishli ekani bilan) olish
export const getAllComments = () => {
  return api.get("/reviews").then((res) => res.data);
};

// --- O'z retseptlarim ---

export const getMyRecipes = () => {
  return api.get("/my-recipes").then((res) => res.data);
};

// --- Admin panel ---

export const getAdminStats = () => {
  return api.get("/admin/stats").then((res) => res.data);
};

export const getAdminUsers = () => {
  return api.get("/admin/users").then((res) => res.data);
};

export const deleteAdminUser = (userId) => {
  return api.delete(`/admin/users/${userId}`).then((res) => res.data);
};

// --- Admin: yangi retsept takliflarini ko'rib chiqish ---

export const getPendingRecipes = () => {
  return api.get("/admin/pending-recipes").then((res) => res.data);
};

export const approveRecipe = (id) => {
  return api.post(`/admin/recipes/${id}/approve`).then((res) => res.data);
};

export const rejectRecipe = (id) => {
  return api.post(`/admin/recipes/${id}/reject`).then((res) => res.data);
};

// Barcha retseptlarni olish. filters = { search, country, category, ingredients, dietTags, ... }
// ingredients va dietTags — massiv bo'lishi mumkin, ular vergul bilan ajratilgan matnga aylantiriladi
export const getRecipes = (filters = {}) => {
  const { ingredients, dietTags, ...rest } = filters;
  const params = { ...rest };
  if (ingredients && ingredients.length > 0) {
    params.ingredients = ingredients.join(",");
  }
  if (dietTags && dietTags.length > 0) {
    params.dietTags = dietTags.join(",");
  }
  return api.get("/recipes", { params }).then((res) => res.data);
};

// Bitta retseptga o'xshash boshqa retseptlarni olish (bir xil davlat/kategoriya)
export const getSimilarRecipes = (id) => {
  return api.get(`/recipes/${id}/similar`).then((res) => res.data);
};

// Bitta retseptni id bo'yicha olish
export const getRecipeById = (id) => {
  return api.get(`/recipes/${id}`).then((res) => res.data);
};

// Yangi retsept qo'shish
export const createRecipe = (recipe) => {
  return api.post("/recipes", recipe).then((res) => res.data);
};

// Retseptni qisman yangilash
export const updateRecipe = (id, updates) => {
  return api.patch(`/recipes/${id}`, updates).then((res) => res.data);
};

// Retseptni o'chirish
export const deleteRecipe = (id) => {
  return api.delete(`/recipes/${id}`).then((res) => res.data);
};

export default api;
