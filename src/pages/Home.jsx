// src/pages/Home.jsx — sayt uchun qisqa "landing" sahifa.
// Qidiruv/filtrlarning to'liq versiyasi endi /recipes sahifasida joylashgan.
import { Link } from "react-router-dom";
import PopularSection from "../components/PopularSection.jsx";
import RecentlyViewedSection from "../components/RecentlyViewedSection.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

function Home() {
  const { t } = useLanguage();

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">
          {t("home.heroTitle")} <span className="hero-highlight">{t("home.heroHighlight")}</span>
        </h1>
        <p className="hero-subtitle">{t("home.heroSubtitle")}</p>
        <Link to="/recipes" className="navbar-btn navbar-btn-filled home-cta-btn">
          {t("home.browseAllButton")}
        </Link>
      </section>

      <PopularSection />

      <RecentlyViewedSection />

      <section className="home-about-preview">
        <div className="home-about-preview-text">
          <h2 className="detail-section-title">{t("about.missionTitle")}</h2>
          <p className="about-text">{t("about.missionText")}</p>
          <Link to="/about" className="recipe-card-btn">
            {t("home.learnMore")}
          </Link>
        </div>
        <div className="home-about-preview-stats">
          <div className="about-stat">
            <span className="about-stat-number">40+</span>
            <span className="about-stat-label">{t("about.statRecipes")}</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">19</span>
            <span className="about-stat-label">{t("about.statCountries")}</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">3</span>
            <span className="about-stat-label">{t("about.statLanguages")}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
