// src/pages/About.jsx
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import Icons from "../utils/icons.jsx";

function About() {
  const { t } = useLanguage();

  return (
    <main className="about-page">
      <section className="about-hero">
        <h1 className="about-title"><Icons.globe /> {t("about.title")}</h1>
        <p className="about-subtitle">{t("about.subtitle")}</p>
      </section>

      <section className="about-section">
        <h2 className="detail-section-title">{t("about.missionTitle")}</h2>
        <p className="about-text">{t("about.missionText")}</p>
      </section>

      <section className="about-stats">
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
      </section>

      <section className="about-section">
        <h2 className="detail-section-title">{t("about.featuresTitle")}</h2>
        <div className="about-features">
          <div className="about-feature">
            <span className="about-feature-icon"><Icons.search /></span>
            <div>
              <h3 className="about-feature-title">{t("about.feature1Title")}</h3>
              <p className="about-feature-text">{t("about.feature1Text")}</p>
            </div>
          </div>
          <div className="about-feature">
            <span className="about-feature-icon"><Icons.video /></span>
            <div>
              <h3 className="about-feature-title">{t("about.feature2Title")}</h3>
              <p className="about-feature-text">{t("about.feature2Text")}</p>
            </div>
          </div>
          <div className="about-feature">
            <span className="about-feature-icon"><Icons.chefHat /></span>
            <div>
              <h3 className="about-feature-title">{t("about.feature3Title")}</h3>
              <p className="about-feature-text">{t("about.feature3Text")}</p>
            </div>
          </div>
          <div className="about-feature">
            <span className="about-feature-icon"><Icons.star /></span>
            <div>
              <h3 className="about-feature-title">{t("about.feature4Title")}</h3>
              <p className="about-feature-text">{t("about.feature4Text")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <h2 className="about-cta-title">{t("about.ctaTitle")}</h2>
        <Link to="/recipes" className="navbar-btn navbar-btn-filled">
          {t("about.ctaButton")}
        </Link>
      </section>
    </main>
  );
}

export default About;
