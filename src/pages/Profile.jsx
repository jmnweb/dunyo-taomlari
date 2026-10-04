// src/pages/Profile.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { changePasswordRequest } from "../api.js";
import Avatar from "../components/Avatar.jsx";

const PHONE_REGEX = /^\+998[0-9]{9}$/;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

function Profile() {
  const { user, checkingSession, updateProfile, uploadAvatar, removeAvatar, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [avatarError, setAvatarError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!checkingSession && !user) {
      navigate("/login");
    }
  }, [user, checkingSession, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  if (checkingSession || !user) {
    return <div className="state-message">{t("home.loading")}</div>;
  }

  async function handleInfoSubmit(e) {
    e.preventDefault();
    setInfoError("");
    setInfoSuccess("");

    if (!name.trim()) {
      return setInfoError(t("auth.nameRequired"));
    }
    if (!PHONE_REGEX.test(phone)) {
      return setInfoError(t("auth.phoneInvalid"));
    }

    setSavingInfo(true);
    try {
      await updateProfile({ name: name.trim(), phone });
      setInfoSuccess(t("profile.saved"));
    } catch (err) {
      setInfoError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setSavingInfo(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword) {
      return setPasswordError(t("auth.fillPhonePassword"));
    }
    if (newPassword.length < 6) {
      return setPasswordError(t("auth.passwordShort"));
    }
    if (newPassword !== confirmNewPassword) {
      return setPasswordError(t("auth.passwordMismatch"));
    }

    setSavingPassword(true);
    try {
      await changePasswordRequest({ currentPassword, newPassword });
      setPasswordSuccess(t("profile.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setSavingPassword(false);
    }
  }

  function handleAvatarPick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(t("profile.avatarTooLarge"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingAvatar(true);
      try {
        await uploadAvatar(reader.result);
      } catch (err) {
        setAvatarError(err.response?.data?.message || t("form.saveError"));
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAvatarRemove() {
    setUploadingAvatar(true);
    try {
      await removeAvatar();
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");

    if (!deletePassword) {
      return setDeleteError(t("profile.confirmPasswordToDelete"));
    }
    if (!confirm(t("profile.confirmDeleteAccount"))) return;

    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      navigate("/");
    } catch (err) {
      setDeleteError(err.response?.data?.message || t("form.saveError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="form-page">
      <h1 className="form-page-title">{t("profile.title")}</h1>

      <div className="recipe-form">
        <h2 className="detail-section-title">{t("profile.avatarTitle")}</h2>
        <div className="avatar-editor">
          <Avatar user={user} size={72} />
          <div className="avatar-editor-actions">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="navbar-btn navbar-btn-outline"
              onClick={handleAvatarPick}
              disabled={uploadingAvatar}
            >
              {t("profile.changeAvatar")}
            </button>
            {user.avatar && (
              <button
                type="button"
                className="navbar-btn navbar-btn-danger"
                onClick={handleAvatarRemove}
                disabled={uploadingAvatar}
              >
                {t("profile.removeAvatar")}
              </button>
            )}
          </div>
        </div>
        {avatarError && <p className="form-error">{avatarError}</p>}
      </div>

      <div className="recipe-form profile-password-block">
        <h2 className="detail-section-title">{t("profile.infoTitle")}</h2>
        <form onSubmit={handleInfoSubmit}>
          <div className="form-group">
            <label className="form-label">{t("auth.nameLabel")}</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("auth.phoneLabel")}</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {infoError && <p className="form-error">{infoError}</p>}
          {infoSuccess && <p className="profile-success">{infoSuccess}</p>}

          <button type="submit" className="auth-submit" disabled={savingInfo}>
            {savingInfo ? t("profile.saving") : t("profile.save")}
          </button>
        </form>
      </div>

      <div className="recipe-form profile-password-block">
        <h2 className="detail-section-title">{t("profile.passwordTitle")}</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label className="form-label">{t("profile.currentPassword")}</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("profile.newPassword")}</label>
            <input
              type="password"
              className="form-input"
              placeholder={t("auth.passwordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("profile.confirmNewPassword")}</label>
            <input
              type="password"
              className="form-input"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          {passwordError && <p className="form-error">{passwordError}</p>}
          {passwordSuccess && <p className="profile-success">{passwordSuccess}</p>}

          <button type="submit" className="auth-submit" disabled={savingPassword}>
            {savingPassword ? t("profile.saving") : t("profile.changePassword")}
          </button>
        </form>
      </div>

      <div className="recipe-form profile-password-block danger-zone">
        <h2 className="detail-section-title">{t("profile.dangerZoneTitle")}</h2>
        <p className="danger-zone-warning">{t("profile.deleteAccountWarning")}</p>

        <div className="form-group">
          <label className="form-label">{t("profile.confirmPasswordToDelete")}</label>
          <input
            type="password"
            className="form-input"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </div>

        {deleteError && <p className="form-error">{deleteError}</p>}

        <button
          type="button"
          className="navbar-btn navbar-btn-danger danger-zone-btn"
          onClick={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? t("profile.saving") : t("profile.deleteAccountButton")}
        </button>
      </div>
    </main>
  );
}

export default Profile;
