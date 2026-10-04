// src/context/AuthContext.jsx
// Foydalanuvchi login holatini butun sayt bo'ylab boshqarish uchun Context.

import { createContext, useContext, useEffect, useState } from "react";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  updateProfileRequest,
  uploadAvatarRequest,
  removeAvatarRequest,
  deleteAccountRequest,
} from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Sahifa birinchi ochilganda: localStorage'da token bo'lsa,
  // backenddan foydalanuvchi ma'lumotini so'rab, sessiyani tiklaymiz.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setCheckingSession(false);
      return;
    }

    getMe()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })
      .finally(() => setCheckingSession(false));
  }, []);

  async function register({ name, phone, password }) {
    const newUser = await registerUser({ name, phone, password });
    localStorage.setItem("token", newUser.token);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }

  async function login({ phone, password }) {
    const loggedInUser = await loginUser({ phone, password });
    localStorage.setItem("token", loggedInUser.token);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // token allaqachon yaroqsiz bo'lsa ham, lokal sessiyani tozalaymiz
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  // Sevimlilar ro'yxati backendda o'zgarganda foydalanuvchi ma'lumotini qayta yuklaymiz
  async function refreshUser() {
    try {
      const freshUser = await getMe();
      localStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }

  // Profil ma'lumotlarini (ism, telefon) yangilaydi
  async function updateProfile({ name, phone }) {
    const updatedUser = await updateProfileRequest({ name, phone });
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  }

  // Profil rasmini yuklaydi (base64 data URL sifatida)
  async function uploadAvatar(avatarDataUrl) {
    const updatedUser = await uploadAvatarRequest(avatarDataUrl);
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  }

  // Profil rasmini olib tashlaydi
  async function removeAvatar() {
    const updatedUser = await removeAvatarRequest();
    const merged = { ...user, ...updatedUser };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  }

  // Hisobni butunlay o'chiradi (parol tasdig'i bilan)
  async function deleteAccount(password) {
    await deleteAccountRequest(password);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        checkingSession,
        register,
        login,
        logout,
        refreshUser,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Har qanday komponentda foydalanuvchi holatiga kirish uchun: const { user } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
