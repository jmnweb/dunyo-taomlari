// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("+998");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!phone || !password) {
      return setError(t("auth.fillPhonePassword"));
    }

    setLoading(true);
    try {
      await login({ phone, password });
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
        <h1 className="auth-title">{t("auth.loginTitle")}</h1>
        <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>

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

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? t("auth.loginChecking") : t("auth.loginSubmit")}
        </button>

        <p className="auth-switch">
          {t("auth.noAccount")} <Link to="/register">{t("navbar.register")}</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
