// server/server.js
// Oddiy Node.js + Express backend. Ma'lumotlar db.json faylida saqlanadi.

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: "6mb" })); // avatar rasmlari base64 formatda yuborilgani uchun limitni oshiramiz

// --- Yordamchi funksiyalar: db.json o'qish va yozish ---
function readDB() {
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const db = JSON.parse(raw);
  // Eski db.json fayllarda bo'lmasligi mumkin bo'lgan massivlarni xavfsiz tiklaymiz
  if (!db.users) db.users = [];
  if (!db.recipes) db.recipes = [];
  if (!db.reviews) db.reviews = [];
  return db;
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ==========================================================================
// AUTENTIFIKATSIYA YORDAMCHILARI
// ==========================================================================

// O'zbekiston telefon raqami formati: +998901234567 (13 belgi, +998 dan keyin 9 ta raqam)
const PHONE_REGEX = /^\+998[0-9]{9}$/;

// Shu ro'yxatdagi telefon raqami bilan ro'yxatdan o'tgan foydalanuvchi
// avtomatik ravishda "admin" bo'ladi. O'zingizni admin qilish uchun
// pastga o'z raqamingizni qo'shing, masalan: "+998901234567"
const ADMIN_PHONES = ["+998999267833"];

// Parolni foydalanuvchi obyektidan tozalab qaytaramiz (hech qachon frontendga yubormaymiz)
function toSafeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// Authorization header'dagi "Bearer <token>" orqali foydalanuvchini topamiz
function getUserFromToken(req, db) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  return db.users.find((u) => u.token === token) || null;
}

// Bu middleware faqat login qilgan foydalanuvchilarga ruxsat beradi.
// req.user va req.db orqali keyingi route ichida foydalanuvchi/db'ga kirish mumkin.
function requireAuth(req, res, next) {
  const db = readDB();
  const user = getUserFromToken(req, db);

  if (!user) {
    return res.status(401).json({ message: "Bu amal uchun avval tizimga kiring" });
  }

  req.user = user;
  req.db = db;
  next();
}

// Bu middleware faqat "admin" roliga ega foydalanuvchilarga ruxsat beradi.
// Avval requireAuth ishlab, keyin shu middleware tekshiradi.
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu bo'lim faqat administratorlar uchun" });
  }
  next();
}

// Retseptga o'rtacha bahoni va sharhlar sonini biriktirib beradi
function attachRecipeStats(recipe, reviews) {
  const recipeReviews = reviews.filter((r) => r.recipeId === recipe.id);
  const averageRating = recipeReviews.length
    ? recipeReviews.reduce((sum, r) => sum + r.rating, 0) / recipeReviews.length
    : 0;

  return {
    ...recipe,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: recipeReviews.length,
  };
}

// Retseptni so'ralgan tilga moslashtiradi. Agar retseptda shu til uchun
// tarjima mavjud bo'lmasa (masalan, foydalanuvchi qo'shgan retsept),
// asl (o'zbekcha) matn qaytariladi.
function localizeRecipe(recipe, lang) {
  if (lang && lang !== "uz" && recipe.i18n && recipe.i18n[lang]) {
    const { i18n, ...base } = recipe;
    const translation = recipe.i18n[lang];

    // Gramm qiymati faqat asl (o'zbekcha) ingredientlar ro'yxatida saqlanadi.
    // Tarjima qilingan ingredient nomlari bilan tartib bo'yicha moslashtirib qo'shamiz.
    const translatedIngredients = translation.ingredients
      ? translation.ingredients.map((ing, i) => ({
          ...ing,
          grams: base.ingredients[i]?.grams,
        }))
      : base.ingredients;

    return { ...base, ...translation, ingredients: translatedIngredients, i18n };
  }
  return recipe;
}

// ==========================================================================
// RETSEPTLAR
// ==========================================================================

// Retsept tayyorlash vaqti matnidan (masalan "90 daqiqa") daqiqa sonini ajratib oladi.
// Vaqt filtri va "tez tayyorlanadigan" saralash uchun ishlatiladi.
function parseCookingMinutes(cookingTime) {
  const match = (cookingTime || "").match(/\d+/);
  return match ? parseInt(match[0], 10) : Infinity;
}

// --- GET /recipes  (barcha retseptlar + qidiruv + filter) ---
// Query parametrlar: ?search=guruch  &country=Uzbekistan  &category=Sho'rva  &lang=ru
// &ingredients=guruch,tovuq  (vergul bilan ajratilgan — retseptda BARCHASI bo'lishi kerak, "VA" mantig'i)
// &difficulty=Oson  &maxTime=60  (daqiqada)  &sortBy=rating|newest|time|calories
// &dietTags=vegetarian,halal  (vergul bilan — retsept BARCHASI mos kelishi kerak)
app.get("/recipes", (req, res) => {
  const { search, country, category, ingredients, difficulty, maxTime, sortBy, dietTags, lang } = req.query;
  const db = readDB();

  // Avval har bir retseptni so'ralgan tilga moslashtiramiz,
  // keyin filtrlashni SHU tildagi matnlar bo'yicha bajaramiz
  // (aks holda, masalan, inglizcha kategoriya nomi o'zbekcha saqlangan
  // qiymat bilan mos kelmay qolardi).
  // Faqat chop etilgan retseptlarni ko'rsatamiz — admin tasdiqlamagan
  // ("pending") retseptlar umumiy ro'yxatda ko'rinmaydi. Eski retseptlarda
  // "status" maydoni umuman bo'lmasligi mumkin — ular chop etilgan deb hisoblanadi.
  const publishedOnly = db.recipes.filter((r) => (r.status || "published") !== "pending");
  let results = publishedOnly.map((r) => localizeRecipe(r, lang));

  if (country) {
    results = results.filter(
      (r) => r.country.toLowerCase() === country.toLowerCase()
    );
  }

  if (category) {
    results = results.filter(
      (r) => r.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Qiyinlik darajasi har doim o'zbekcha saqlanadi (Oson/O'rta/Qiyin),
  // shuning uchun bu yerda tarjima qilinmagan qiymat bilan solishtiramiz
  if (difficulty) {
    results = results.filter((r) => r.difficulty === difficulty);
  }

  if (maxTime) {
    const max = Number(maxTime);
    results = results.filter((r) => parseCookingMinutes(r.cookingTime) <= max);
  }

  if (dietTags) {
    const requiredTags = dietTags.split(",").map((t) => t.trim()).filter(Boolean);
    results = results.filter((r) =>
      requiredTags.every((tag) => (r.dietTags || []).includes(tag))
    );
  }

  // Tezkor ozuqaviy filtrlar
  if (req.query.lowCalorie === "true") {
    results = results.filter((r) => (r.nutrition?.calories ?? Infinity) <= 350);
  }
  if (req.query.highProtein === "true") {
    results = results.filter((r) => (r.nutrition?.protein ?? 0) >= 25);
  }

  if (ingredients) {
    const requiredIngredients = ingredients
      .split(",")
      .map((i) => i.trim().toLowerCase())
      .filter(Boolean);

    // Retsept faqat SO'RALGAN INGREDIENTLARNING BARCHASI mavjud bo'lsagina natijaga kiradi
    results = results.filter((r) =>
      requiredIngredients.every((required) =>
        r.ingredients.some((ing) => ing.name.toLowerCase().includes(required))
      )
    );
  }

  if (search) {
    const q = search.toLowerCase().trim();
    results = results.filter((r) => {
      const inTitle = r.title.toLowerCase().includes(q);
      const inCountry = r.country.toLowerCase().includes(q);
      const inCategory = r.category.toLowerCase().includes(q);
      const inIngredients = r.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(q)
      );
      return inTitle || inCountry || inCategory || inIngredients;
    });
  }

  let withStats = results.map((r) => attachRecipeStats(r, db.reviews));

  if (sortBy === "rating") {
    withStats.sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);
  } else if (sortBy === "newest") {
    withStats.sort((a, b) => b.id - a.id);
  } else if (sortBy === "time") {
    withStats.sort((a, b) => parseCookingMinutes(a.cookingTime) - parseCookingMinutes(b.cookingTime));
  } else if (sortBy === "calories") {
    withStats.sort(
      (a, b) => (a.nutrition?.calories ?? Infinity) - (b.nutrition?.calories ?? Infinity)
    );
  }

  res.json(withStats);
});

// --- GET /recipes/:id/similar  (shu davlat/kategoriyadagi boshqa retseptlar) ---
app.get("/recipes/:id/similar", (req, res) => {
  const db = readDB();
  const recipe = db.recipes.find((r) => r.id === Number(req.params.id));

  if (!recipe) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  const others = db.recipes.filter(
    (r) => r.id !== recipe.id && (r.status || "published") !== "pending"
  );

  // Avval bir xil davlatdagi taomlar, keyin bir xil kategoriyadagilar bilan to'ldiramiz
  const sameCountry = others.filter((r) => r.country === recipe.country);
  const sameCategory = others.filter(
    (r) => r.category === recipe.category && r.country !== recipe.country
  );

  const combined = [...sameCountry, ...sameCategory].slice(0, 6);

  res.json(
    combined.map((r) => attachRecipeStats(localizeRecipe(r, req.query.lang), db.reviews))
  );
});

// --- GET /recipes/:id  (bitta retsept) ---
app.get("/recipes/:id", (req, res) => {
  const db = readDB();
  const recipe = db.recipes.find((r) => r.id === Number(req.params.id));

  if (!recipe) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  const localized = localizeRecipe(recipe, req.query.lang);
  res.json(attachRecipeStats(localized, db.reviews));
});

// --- POST /recipes  (yangi retsept qo'shish — faqat login qilganlar uchun) ---
app.post("/recipes", requireAuth, (req, res) => {
  const db = req.db;

  const newRecipe = {
    id: db.recipes.length ? Math.max(...db.recipes.map((r) => r.id)) + 1 : 1,
    title: req.body.title || "Nomsiz taom",
    image: req.body.image || "",
    country: req.body.country || "",
    flag: req.body.flag || "",
    category: req.body.category || "",
    description: req.body.description || "",
    ingredients: req.body.ingredients || [],
    instructions: req.body.instructions || [],
    cookingTime: req.body.cookingTime || "",
    servings: req.body.servings || 1,
    difficulty: req.body.difficulty || "Oson",
    videoUrl: req.body.videoUrl || "",
    nutrition: req.body.nutrition || null,
    dietTags: req.body.dietTags || [],
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: new Date().toISOString(),
    // Admin qo'shgan retseptlar darhol chop etiladi, oddiy foydalanuvchilarniki
    // esa admin tasdiqlashini kutadi ("pending" holatida)
    status: req.user.role === "admin" ? "published" : "pending",
  };

  db.recipes.push(newRecipe);
  writeDB(db);

  res.status(201).json(newRecipe);
});

// --- PATCH /recipes/:id  (faqat retseptni qo'shgan foydalanuvchi tahrirlay oladi) ---
app.patch("/recipes/:id", requireAuth, (req, res) => {
  const db = req.db;
  const index = db.recipes.findIndex((r) => r.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  if (
    db.recipes[index].createdBy &&
    db.recipes[index].createdBy !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Faqat o'zingiz qo'shgan retseptni tahrirlay olasiz" });
  }

  db.recipes[index] = { ...db.recipes[index], ...req.body };
  writeDB(db);

  res.json(db.recipes[index]);
});

// --- DELETE /recipes/:id  (faqat retseptni qo'shgan foydalanuvchi o'chira oladi) ---
app.delete("/recipes/:id", requireAuth, (req, res) => {
  const db = req.db;
  const index = db.recipes.findIndex((r) => r.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  if (
    db.recipes[index].createdBy &&
    db.recipes[index].createdBy !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ message: "Faqat o'zingiz qo'shgan retseptni o'chira olasiz" });
  }

  const deleted = db.recipes.splice(index, 1);

  // Retsept bilan birga unga tegishli sharhlarni ham tozalaymiz
  db.reviews = db.reviews.filter((r) => r.recipeId !== Number(req.params.id));

  writeDB(db);

  res.json({ message: "O'chirildi", recipe: deleted[0] });
});

// --- GET /my-recipes  (joriy foydalanuvchi qo'shgan retseptlar) ---
app.get("/my-recipes", requireAuth, (req, res) => {
  const db = req.db;
  const myRecipes = db.recipes.filter((r) => r.createdBy === req.user.id);
  res.json(
    myRecipes.map((r) => attachRecipeStats(localizeRecipe(r, req.query.lang), db.reviews))
  );
});

// ==========================================================================
// SHARHLAR VA BAHOLAR (Reviews & Ratings)
// ==========================================================================

// --- GET /reviews  (SAYTDAGI BARCHA sharhlar, qaysi retseptga tegishli ekani bilan) ---
// ReadComents.jsx sahifasi uchun: har bir foydalanuvchi komentariyasi
// tegishli retseptning nomi va rasmi bilan birga qaytariladi.
app.get("/reviews", (req, res) => {
  const db = readDB();
  const { lang } = req.query;

  const allReviews = [...db.reviews]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((review) => {
      const recipe = db.recipes.find((r) => r.id === review.recipeId);
      const localizedRecipe = recipe ? localizeRecipe(recipe, lang) : null;

      return {
        ...review,
        recipe: localizedRecipe
          ? {
              id: localizedRecipe.id,
              title: localizedRecipe.title,
              image: localizedRecipe.image,
              country: localizedRecipe.country,
              flag: localizedRecipe.flag,
            }
          : null, // Retsept o'chirilgan bo'lishi mumkin
      };
    });

  res.json(allReviews);
});

// --- GET /recipes/:id/reviews  (retseptga yozilgan barcha sharhlar) ---
app.get("/recipes/:id/reviews", (req, res) => {
  const db = readDB();
  const recipeId = Number(req.params.id);
  const reviews = db.reviews
    .filter((r) => r.recipeId === recipeId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(reviews);
});

// --- POST /recipes/:id/reviews  (baho va sharh qoldirish — login talab qilinadi) ---
// Bir foydalanuvchi bitta retseptga faqat bitta sharh yoza oladi;
// qayta yuborsa, avvalgi sharhi yangilanadi.
app.post("/recipes/:id/reviews", requireAuth, (req, res) => {
  const db = req.db;
  const recipeId = Number(req.params.id);
  const { rating, comment } = req.body;

  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  const ratingNumber = Number(rating);
  if (!ratingNumber || ratingNumber < 1 || ratingNumber > 5) {
    return res.status(400).json({ message: "Baho 1 dan 5 gacha bo'lishi kerak" });
  }

  const existingIndex = db.reviews.findIndex(
    (r) => r.recipeId === recipeId && r.userId === req.user.id
  );

  if (existingIndex !== -1) {
    // Foydalanuvchi avval sharh qoldirgan — yangilaymiz
    db.reviews[existingIndex] = {
      ...db.reviews[existingIndex],
      rating: ratingNumber,
      comment: comment || "",
      updatedAt: new Date().toISOString(),
    };
    writeDB(db);
    return res.json(db.reviews[existingIndex]);
  }

  const newReview = {
    id: db.reviews.length ? Math.max(...db.reviews.map((r) => r.id)) + 1 : 1,
    recipeId,
    userId: req.user.id,
    userName: req.user.name,
    rating: ratingNumber,
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };

  db.reviews.push(newReview);
  writeDB(db);

  res.status(201).json(newReview);
});

// --- DELETE /reviews/:id  (faqat sharh egasi o'chira oladi) ---
app.delete("/reviews/:id", requireAuth, (req, res) => {
  const db = req.db;
  const index = db.reviews.findIndex((r) => r.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Sharh topilmadi" });
  }

  if (db.reviews[index].userId !== req.user.id) {
    return res.status(403).json({ message: "Faqat o'z sharhingizni o'chira olasiz" });
  }

  const deleted = db.reviews.splice(index, 1);
  writeDB(db);

  res.json({ message: "Sharh o'chirildi", review: deleted[0] });
});

// ==========================================================================
// SEVIMLILAR (Favorites)
// ==========================================================================

// --- GET /favorites  (joriy foydalanuvchining sevimli retseptlari) ---
app.get("/favorites", requireAuth, (req, res) => {
  const db = req.db;
  const favoriteIds = req.user.favorites || [];
  const favoriteRecipes = db.recipes.filter(
    (r) => favoriteIds.includes(r.id) && (r.status || "published") !== "pending"
  );

  res.json(
    favoriteRecipes.map((r) =>
      attachRecipeStats(localizeRecipe(r, req.query.lang), db.reviews)
    )
  );
});

// --- POST /favorites/:recipeId  (sevimlilarga qo'shish) ---
app.post("/favorites/:recipeId", requireAuth, (req, res) => {
  const db = req.db;
  const recipeId = Number(req.params.recipeId);

  const recipe = db.recipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  if (!db.users[userIndex].favorites) db.users[userIndex].favorites = [];

  if (!db.users[userIndex].favorites.includes(recipeId)) {
    db.users[userIndex].favorites.push(recipeId);
    writeDB(db);
  }

  res.json({ favorites: db.users[userIndex].favorites });
});

// --- DELETE /favorites/:recipeId  (sevimlilardan olib tashlash) ---
app.delete("/favorites/:recipeId", requireAuth, (req, res) => {
  const db = req.db;
  const recipeId = Number(req.params.recipeId);

  const userIndex = db.users.findIndex((u) => u.id === req.user.id);
  const current = db.users[userIndex].favorites || [];
  db.users[userIndex].favorites = current.filter((id) => id !== recipeId);

  writeDB(db);

  res.json({ favorites: db.users[userIndex].favorites });
});

// --- GET /admin/pending-recipes  (admin tasdiqlashini kutayotgan retseptlar) ---
app.get("/admin/pending-recipes", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const pending = db.recipes.filter((r) => r.status === "pending");
  res.json(
    pending.map((r) => attachRecipeStats(localizeRecipe(r, req.query.lang), db.reviews))
  );
});

// --- POST /admin/recipes/:id/approve  (retseptni tasdiqlab, chop etish) ---
app.post("/admin/recipes/:id/approve", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const index = db.recipes.findIndex((r) => r.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  db.recipes[index].status = "published";
  writeDB(db);

  res.json(db.recipes[index]);
});

// --- POST /admin/recipes/:id/reject  (retseptni rad etib, butunlay o'chirish) ---
app.post("/admin/recipes/:id/reject", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const index = db.recipes.findIndex((r) => r.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Retsept topilmadi" });
  }

  const deleted = db.recipes.splice(index, 1);
  db.reviews = db.reviews.filter((rv) => rv.recipeId !== Number(req.params.id));
  writeDB(db);

  res.json({ message: "Retsept rad etildi", recipe: deleted[0] });
});

// ==========================================================================
// ADMIN PANEL
// ==========================================================================

// --- GET /admin/stats  (umumiy statistika) ---
app.get("/admin/stats", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;

  const recipesByCountry = {};
  db.recipes.forEach((r) => {
    recipesByCountry[r.country] = (recipesByCountry[r.country] || 0) + 1;
  });

  const recipesByCategory = {};
  db.recipes.forEach((r) => {
    recipesByCategory[r.category] = (recipesByCategory[r.category] || 0) + 1;
  });

  const recipesWithStats = db.recipes
    .map((r) => attachRecipeStats(r, db.reviews))
    .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount);

  res.json({
    totalRecipes: db.recipes.length,
    totalUsers: db.users.length,
    totalReviews: db.reviews.length,
    pendingCount: db.recipes.filter((r) => r.status === "pending").length,
    recipesByCountry, // masalan: { "Uzbekistan": 3, "Italy": 3, ... }
    recipesByCategory,
    topRatedRecipes: recipesWithStats.filter((r) => r.reviewCount > 0).slice(0, 5),
    mostFavorited: [...db.recipes]
      .map((r) => ({
        ...r,
        favoritedCount: db.users.filter((u) => (u.favorites || []).includes(r.id)).length,
      }))
      .sort((a, b) => b.favoritedCount - a.favoritedCount)
      .slice(0, 5),
  });
});

// --- GET /admin/users  (barcha foydalanuvchilar ro'yxati) ---
app.get("/admin/users", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  res.json(db.users.map(toSafeUser));
});

// --- DELETE /admin/users/:id  (foydalanuvchini o'chirish) ---
app.delete("/admin/users/:id", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const index = db.users.findIndex((u) => u.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
  }

  if (db.users[index].role === "admin") {
    return res.status(403).json({ message: "Administratorni o'chirib bo'lmaydi" });
  }

  const deleted = db.users.splice(index, 1);
  writeDB(db);

  res.json({ message: "Foydalanuvchi o'chirildi", user: toSafeUser(deleted[0]) });
});

// ==========================================================================
// AUTENTIFIKATSIYA (telefon raqami bilan ro'yxatdan o'tish / kirish)
// ==========================================================================

// --- POST /register  (yangi foydalanuvchi ro'yxatdan o'tishi) ---
app.post("/register", (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: "Ism, telefon va parolni to'ldiring" });
  }

  if (!PHONE_REGEX.test(phone)) {
    return res.status(400).json({
      message: "Telefon raqam formati noto'g'ri. Namuna: +998901234567",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lsin" });
  }

  const db = readDB();

  const alreadyExists = db.users.find((u) => u.phone === phone);
  if (alreadyExists) {
    return res.status(409).json({ message: "Bu raqam allaqachon ro'yxatdan o'tgan" });
  }

  const newUser = {
    id: db.users.length ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
    name,
    phone,
    password: bcrypt.hashSync(password, 10), // parolni hech qachon ochiq saqlamaymiz
    token: crypto.randomBytes(24).toString("hex"),
    favorites: [],
    avatar: null,
    role: ADMIN_PHONES.includes(phone) ? "admin" : "user",
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json(toSafeUser(newUser));
});

// --- POST /login  (telefon + parol bilan kirish) ---
app.post("/login", (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Telefon va parolni kiriting" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.phone === phone);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Telefon raqam yoki parol noto'g'ri" });
  }

  // Har bir kirishda yangi token yaratamiz
  user.token = crypto.randomBytes(24).toString("hex");
  if (!user.favorites) user.favorites = [];
  writeDB(db);

  res.json(toSafeUser(user));
});

// --- GET /me  (token orqali joriy foydalanuvchini aniqlash) ---
// Frontend sahifa yangilanganda foydalanuvchini "eslab qolish" uchun shu endpointdan foydalanadi.
app.get("/me", (req, res) => {
  const db = readDB();
  const user = getUserFromToken(req, db);

  if (!user) {
    return res.status(401).json({ message: "Sessiya yaroqsiz, qaytadan kiring" });
  }

  res.json(toSafeUser(user));
});

// --- PATCH /profile  (ism va telefon raqamni o'zgartirish) ---
app.patch("/profile", requireAuth, (req, res) => {
  const db = req.db;
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Ism va telefon raqamni to'ldiring" });
  }

  if (!PHONE_REGEX.test(phone)) {
    return res.status(400).json({
      message: "Telefon raqam formati noto'g'ri. Namuna: +998901234567",
    });
  }

  const takenByAnother = db.users.find(
    (u) => u.phone === phone && u.id !== req.user.id
  );
  if (takenByAnother) {
    return res.status(409).json({ message: "Bu raqam boshqa foydalanuvchida ro'yxatdan o'tgan" });
  }

  const index = db.users.findIndex((u) => u.id === req.user.id);
  db.users[index].name = name;
  db.users[index].phone = phone;
  writeDB(db);

  res.json(toSafeUser(db.users[index]));
});

// --- POST /profile/change-password  (joriy parolni tekshirib, yangisiga o'zgartirish) ---
app.post("/profile/change-password", requireAuth, (req, res) => {
  const db = req.db;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Joriy va yangi parolni kiriting" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Yangi parol kamida 6 ta belgidan iborat bo'lsin" });
  }

  const index = db.users.findIndex((u) => u.id === req.user.id);
  const user = db.users[index];

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(401).json({ message: "Joriy parol noto'g'ri" });
  }

  user.password = bcrypt.hashSync(newPassword, 10);
  writeDB(db);

  res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
});

// --- POST /profile/avatar  (profil rasmini yuklash) ---
// "avatar" — kichik rasm uchun base64 data URL string (masalan "data:image/png;base64,...")
app.post("/profile/avatar", requireAuth, (req, res) => {
  const db = req.db;
  const { avatar } = req.body;

  if (!avatar || typeof avatar !== "string") {
    return res.status(400).json({ message: "Rasm topilmadi" });
  }

  const index = db.users.findIndex((u) => u.id === req.user.id);
  db.users[index].avatar = avatar;
  writeDB(db);

  res.json(toSafeUser(db.users[index]));
});

// --- DELETE /profile/avatar  (profil rasmini olib tashlash) ---
app.delete("/profile/avatar", requireAuth, (req, res) => {
  const db = req.db;
  const index = db.users.findIndex((u) => u.id === req.user.id);
  db.users[index].avatar = null;
  writeDB(db);

  res.json(toSafeUser(db.users[index]));
});

// --- DELETE /profile  (hisobni butunlay o'chirish) ---
// Xavfsizlik uchun joriy parol talab qilinadi.
app.delete("/profile", requireAuth, (req, res) => {
  const db = req.db;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Hisobni o'chirish uchun parolni kiriting" });
  }

  if (!bcrypt.compareSync(password, req.user.password)) {
    return res.status(401).json({ message: "Parol noto'g'ri" });
  }

  // Foydalanuvchi qo'shgan retseptlarni va ularga tegishli sharhlarni o'chiramiz
  const myRecipeIds = db.recipes.filter((r) => r.createdBy === req.user.id).map((r) => r.id);
  db.recipes = db.recipes.filter((r) => r.createdBy !== req.user.id);

  // Foydalanuvchining boshqa retseptlarga yozgan sharhlarini va
  // o'chirilgan retseptlarga tegishli barcha sharhlarni tozalaymiz
  db.reviews = db.reviews.filter(
    (r) => r.userId !== req.user.id && !myRecipeIds.includes(r.recipeId)
  );

  // Foydalanuvchining o'zini o'chiramiz
  db.users = db.users.filter((u) => u.id !== req.user.id);

  writeDB(db);

  res.json({ message: "Hisob muvaffaqiyatli o'chirildi" });
});

// --- POST /logout  (tokenni bekor qilish) ---
app.post("/logout", (req, res) => {
  const db = readDB();
  const user = getUserFromToken(req, db);

  if (user) {
    user.token = null;
    writeDB(db);
  }

  res.json({ message: "Chiqildi" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server ishga tushdi: http://localhost:${PORT}`);
});
