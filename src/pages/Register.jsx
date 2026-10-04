// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import ShapeCaptcha from "../components/ShapeCaptcha.jsx";

const PHONE_REGEX = /^\+998[0-9]{9}$/;

function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      return setError(t("auth.nameRequired"));
    }
    if (!PHONE_REGEX.test(phone)) {
      return setError(t("auth.phoneInvalid"));
    }
    if (password.length < 6) {
      return setError(t("auth.passwordShort"));
    }
    if (password !== confirmPassword) {
      return setError(t("auth.passwordMismatch"));
    }

    // Forma to'liq va to'g'ri to'ldirilgan — endi haqiqiy odam ekanini
    // tasdiqlash uchun geometrik figura captcha'sini ko'rsatamiz.
    setShowCaptcha(true);
  }

  async function handleCaptchaSuccess() {
    setShowCaptcha(false);
    setLoading(true);
    try {
      await register({ name: name.trim(), phone, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">{t("auth.registerTitle")}</h1>
        <p className="auth-subtitle">{t("auth.registerSubtitle")}</p>

        <div className="form-group">
          <label className="form-label">{t("auth.nameLabel")}</label>
          <input
            type="text"
            className="form-input"
            placeholder={t("auth.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("auth.phoneLabel")}</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+998901234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("auth.passwordLabel")}</label>
          <input
            type="password"
            className="form-input"
            placeholder={t("auth.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("auth.confirmLabel")}</label>
          <input
            type="password"
            className="form-input"
            placeholder={t("auth.confirmPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("auth.registerSending") : t("auth.registerSubmit")}
        </button>

        <p className="auth-switch">
          {t("auth.haveAccount")} <Link to="/login">{t("navbar.login")}</Link>
        </p>
      </form>

      {showCaptcha && (
        <ShapeCaptcha onSuccess={handleCaptchaSuccess} onCancel={() => setShowCaptcha(false)} />
      )}
    </main>
  );
}

export default Register;
