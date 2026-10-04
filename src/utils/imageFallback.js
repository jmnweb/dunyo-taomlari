// src/utils/imageFallback.js
// Rasm yuklanmasa (broken link, tarmoq xatosi va h.k.) chiqadigan zaxira tasvir.
// Tashqi manbaga bog'liq bo'lmasligi uchun inline SVG data URI ishlatiladi.
const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#e8e2d8"/>
    <text x="50%" y="50%" font-size="64" text-anchor="middle" dominant-baseline="central">🍽️</text>
  </svg>`
)}`;

// <img onError={handleImageError}> shaklida ishlatiladi.
// Cheksiz tsiklni oldini olish uchun bitta marta o'rnatiladi.
export function handleImageError(event) {
  const img = event.currentTarget;
  if (img.dataset.fallback === "1") return;
  img.dataset.fallback = "1";
  img.src = PLACEHOLDER_SVG;
}

export default PLACEHOLDER_SVG;
