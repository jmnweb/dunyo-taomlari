// src/utils/scaling.js

// Ingredient miqdori matnining boshidagi sonni topib, berilgan koeffitsientga
// ko'paytiradi (masalan "500 g" va factor=2 -> "1000 g"). Agar boshida son
// bo'lmasa (masalan "ta'mga qarab", "bir chimdim"), matn o'zgarishsiz qoladi.
export function scaleAmount(amount, factor) {
  if (!amount) return amount;

  const match = amount.match(/^([\d.]+)(\s*.*)$/);
  if (!match) return amount;

  const number = parseFloat(match[1]);
  if (Number.isNaN(number)) return amount;

  const rest = match[2];
  const scaled = Math.round(number * factor * 10) / 10;
  const display = Number.isInteger(scaled) ? scaled : scaled.toFixed(1);

  return `${display}${rest}`;
}

// Miqdor matni allaqachon grammda ifodalanganmi, tekshiradi (masalan "700 g").
// Agar shunday bo'lsa, alohida gramm ko'rsatkichini qo'shimcha ko'rsatish shart emas.
export function isPlainGrams(amount) {
  return /^\d+(\.\d+)?\s*g$/i.test((amount || "").trim());
}

// Ozuqaviy qiymatni (kaloriya, oqsil va h.k.) koeffitsientga ko'ra qayta hisoblaydi
export function scaleNutrient(value, factor) {
  if (value === undefined || value === null) return value;
  return Math.round(value * factor);
}
