// src/context/LanguageContext.jsx
// Sayt tilini (uz/ru/en) butun ilova bo'ylab boshqaradi.

import { createContext, useContext, useState } from "react";
import { translations } from "../i18n/translations.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem("lang");
    return saved && translations[saved] ? saved : "uz";
  });

  function setLang(code) {
    if (!translations[code]) return;
    localStorage.setItem("lang", code);
    setLangState(code);
  }

  // "detail.time" kabi nuqta bilan ajratilgan kalitni lug'atdan topib beradi.
  // vars = { count: 5 } berilsa, matndagi {count} shu qiymat bilan almashtiriladi.
  function t(key, vars = {}) {
    const parts = key.split(".");
    let node = translations[lang];
    for (const part of parts) {
      node = node?.[part];
    }
    if (typeof node !== "string") return key;

    return Object.keys(vars).reduce(
      (text, varName) => text.replace(`{${varName}}`, vars[varName]),
      node
    );
  }

  // Retsept qiyinlik darajasini (Oson/O'rta/Qiyin) joriy tilga o'giradi.
  // Ma'lumot bazasida qiymat har doim o'zbekcha saqlanadi, faqat ko'rinishi tarjima qilinadi.
  function translateDifficulty(value) {
    return translations[lang]?.difficulty?.[value] || value;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, translateDifficulty }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
