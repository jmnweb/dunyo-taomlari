// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  getRecipes,
  deleteRecipe,
  getPendingRecipes,
  approveRecipe,
  rejectRecipe,
} from "../api.js";
import Icons from "../utils/icons.jsx";
import { handleImageError } from "../utils/imageFallback.js";
import BarChart from "../components/BarChart.jsx";
import StarRating from "../components/StarRating.jsx";

function Admin() {
  const { user, checkingSession } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!checkingSession && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, checkingSession, navigate]);

  function loadAll() {
    setLoading(true);
    return Promise.all([getAdminStats(), getAdminUsers(), getRecipes(), getPendingRecipes()])
      .then(([statsData, usersData, recipesData, pendingData]) => {
        setStats(statsData);
        setUsers(usersData);
        setRecipes(recipesData);
        setPendingRecipes(pendingData);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDeleteRecipe(id) {
    if (!confirm(t("admin.confirmDeleteRecipe"))) return;
    await deleteRecipe(id);
    setRecipes(recipes.filter((r) => r.id !== id));
  }

  async function handleDeleteUser(id) {
    if (!confirm(t("admin.confirmDeleteUser"))) return;
    try {
      await deleteAdminUser(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || t("admin.cantDeleteUser"));
    }
  }

  async function handleApprove(id) {
    const approved = await approveRecipe(id);
    setPendingRecipes(pendingRecipes.filter((r) => r.id !== id));
    setRecipes([...recipes, approved]);
  }

  async function handleReject(id) {
    if (!confirm(t("admin.confirmRejectRecipe"))) return;
    await rejectRecipe(id);
    setPendingRecipes(pendingRecipes.filter((r) => r.id !== id));
  }

  if (checkingSession || !user || user.role !== "admin" || loading) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  const countryData = Object.entries(stats.recipesByCountry).map(([label, value]) => ({
    label,
    value,
  }));
  const categoryData = Object.entries(stats.recipesByCategory).map(([label, value]) => ({
    label,
    value,
  }));

  return (
    <main className="admin-page">
      <h1 className="hero-title admin-title"><Icons.tools /> {t("admin.title")}</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
          <Icons.bell /> {t("admin.tabPending")} {pendingRecipes.length > 0 && `(${pendingRecipes.length})`}
        </button>
        <button className={`admin-tab ${tab === "stats" ? "active" : ""}`} onClick={() => setTab("stats")}>
          <Icons.chartBar /> {t("admin.tabStats")}
        </button>
        <button className={`admin-tab ${tab === "recipes" ? "active" : ""}`} onClick={() => setTab("recipes")}>
          <Icons.utensils /> {t("admin.tabRecipes")} ({recipes.length})
        </button>
        <button className={`admin-tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
          <Icons.users /> {t("admin.tabUsers")} ({users.length})
        </button>
      </div>

      {tab === "pending" && (
        <div className="pending-list">
          {pendingRecipes.length === 0 ? (
            <p className="reviews-empty">{t("admin.noPending")}</p>
          ) : (
            pendingRecipes.map((r) => (
              <div key={r.id} className="pending-card">
                <img src={r.image} alt={r.title} className="pending-card-image" onError={handleImageError} />
                <div className="pending-card-body">
                  <div className="pending-card-top">
                    <h3 className="pending-card-title">
                      {r.flag} {r.title}
                    </h3>
                    <Link to={`/recipe/${r.id}`} className="back-link">
                      {t("admin.previewLink")} <Icons.arrowRight />
                    </Link>
                  </div>
                  <p className="pending-card-meta">
                    {r.country} · {r.category} · {t("admin.colAuthor")}: {r.createdByName}
                  </p>
                  <p className="pending-card-description">{r.description}</p>
                  <div className="pending-card-actions">
                    <button className="navbar-btn navbar-btn-filled" onClick={() => handleApprove(r.id)}>
                      <Icons.check /> {t("admin.approve")}
                    </button>
                    <button className="navbar-btn navbar-btn-danger" onClick={() => handleReject(r.id)}>
                      <Icons.close /> {t("admin.reject")}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "stats" && (
        <div className="admin-stats">
          <div className="admin-stat-cards">
            <div className="admin-stat-card">
              <span className="admin-stat-number">{stats.totalRecipes}</span>
              <span className="admin-stat-label">{t("admin.totalRecipes")}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{stats.totalUsers}</span>
              <span className="admin-stat-label">{t("admin.totalUsers")}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-number">{stats.totalReviews}</span>
              <span className="admin-stat-label">{t("admin.totalReviews")}</span>
            </div>
          </div>

          <div className="admin-charts">
            <div className="admin-chart-block">
              <h3 className="detail-section-title">{t("admin.byCountry")}</h3>
              <BarChart data={countryData} />
            </div>
            <div className="admin-chart-block">
              <h3 className="detail-section-title">{t("admin.byCategory")}</h3>
              <BarChart data={categoryData} />
            </div>
          </div>

          <div className="admin-chart-block">
            <h3 className="detail-section-title"><Icons.star /> {t("admin.topRated")}</h3>
            {stats.topRatedRecipes.length === 0 ? (
              <p className="reviews-empty">{t("admin.noReviewsYet")}</p>
            ) : (
              <ul className="admin-list">
                {stats.topRatedRecipes.map((r) => (
                  <li key={r.id} className="admin-list-item">
                    <Link to={`/recipe/${r.id}`}>{r.title}</Link>
                    <StarRating rating={r.averageRating} size="0.85rem" />
                    <span className="recipe-card-rating-text">
                      {r.averageRating} ({r.reviewCount})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-chart-block">
            <h3 className="detail-section-title"><Icons.heart /> {t("admin.mostFavorited")}</h3>
            <ul className="admin-list">
              {stats.mostFavorited.map((r) => (
                <li key={r.id} className="admin-list-item">
                  <Link to={`/recipe/${r.id}`}>{r.title}</Link>
                  <span className="recipe-card-rating-text"><Icons.heart /> {r.favoritedCount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "recipes" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.colName")}</th>
                <th>{t("admin.colCountry")}</th>
                <th>{t("admin.colAuthor")}</th>
                <th>{t("admin.colRating")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((r) => (
                <tr key={r.id}>
                  <td><Link to={`/recipe/${r.id}`}>{r.title}</Link></td>
                  <td>{r.flag} {r.country}</td>
                  <td>{r.createdByName || "—"}</td>
                  <td>{r.averageRating > 0 ? <><Icons.star /> {r.averageRating}</> : "—"}</td>
                  <td>
                    <button className="review-delete" onClick={() => handleDeleteRecipe(r.id)}>
                      {t("admin.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "users" && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.colUserName")}</th>
                <th>{t("admin.colPhone")}</th>
                <th>{t("admin.colRole")}</th>
                <th>{t("admin.colJoined")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.role === "admin" ? <><Icons.tools /> {t("admin.roleAdmin")}</> : t("admin.roleUser")}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.role !== "admin" && (
                      <button className="review-delete" onClick={() => handleDeleteUser(u.id)}>
                        {t("admin.delete")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Admin;
