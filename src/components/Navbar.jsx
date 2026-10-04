// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { LANGUAGES } from "../i18n/translations.js";
import Avatar from "./Avatar.jsx";
import Icons from "../utils/icons.jsx";

function Navbar() {
  const { user, logout, checkingSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="navbar-logo-icon"><Icons.compass /></span>
        <span className="navbar-logo-text">
          Dunyo <span className="navbar-logo-accent">Taomlari</span>
        </span>
      </Link>

      <p className="navbar-tagline">{t("navbar.tagline")}</p>

      <div className="navbar-auth">
        {/* Til tanlash */}
        <div className="lang-switcher">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${lang === l.code ? "active" : ""}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Dark / Light rejim tugmasi */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Icons.sun /> : <Icons.moon />}
        </button>

        <Link to="/recipes" className="navbar-btn navbar-btn-outline">
          <Icons.utensils /> {t("navbar.recipes")}
        </Link>

        <Link to="/ingredients" className="navbar-btn navbar-btn-outline">
          <Icons.carrot /> {t("navbar.ingredients")}
        </Link>

        <Link to="/about" className="navbar-btn navbar-btn-outline">
          {t("navbar.about")}
        </Link>

        {checkingSession ? null : user ? (
          <>
            {user.role === "admin" && (
              <Link to="/admin" className="navbar-btn navbar-btn-admin">
                <Icons.tools /> {t("navbar.adminPanel")}
              </Link>
            )}
            <Link to="/add-recipe" className="navbar-btn navbar-btn-outline">
              {t("navbar.addRecipe")}
            </Link>
            <Link to="/favorites" className="navbar-btn navbar-btn-outline">
              <Icons.heart /> {t("navbar.favorites")}
            </Link>
            <Link to="/my-recipes" className="navbar-btn navbar-btn-outline">
              {t("navbar.myRecipes")}
            </Link>
            <Link to="/comments" className="navbar-btn navbar-btn-outline">
              <Icons.comment /> {t("navbar.allComments")}
            </Link>
            <span className="navbar-user" onClick={() => navigate("/profile")}>
              <Avatar user={user} size={24} /> {user.name}
            </span>
            <button className="navbar-btn navbar-btn-outline" onClick={handleLogout}>
              {t("navbar.logout")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-btn navbar-btn-outline">
              {t("navbar.login")}
            </Link>
            <Link to="/register" className="navbar-btn navbar-btn-filled">
              {t("navbar.register")}
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
