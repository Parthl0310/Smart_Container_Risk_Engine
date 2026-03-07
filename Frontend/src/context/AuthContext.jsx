/* ─────────────────────────────────────────────────────────────────────────────
   context/AuthContext.jsx
   ─────────────────────────────────────────────────────────────────────────────
   Global authentication state for the entire app.

   Provides via useAuth():
     user         Object | null  — current user { _id, name, email, role, profilePhoto }
     accessToken  String | null  — JWT stored in localStorage
     loading      Boolean        — true while session is being restored on page load
     isAdmin      Boolean        — shortcut: user?.role === "admin"
     login()      Function       — POST /api/auth/login
     register()   Function       — POST /api/auth/register  (accepts FormData)
     logout()     Function       — POST /api/auth/logout

   Session restore on page load:
     On mount, attempts POST /api/auth/refresh via httpOnly cookie.
     If successful → user is silently re-authenticated without needing to log in again.
     If failed    → user stays logged out.

   ── BACKEND API ENDPOINTS USED IN THIS FILE ──────────────────────────────────

   POST /api/auth/register
     → Body: FormData { name, email, password, profilePhoto? (file) }
     ← Returns: { user: {...}, accessToken: "eyJ..." }
     → Backend: backend/controllers/authController.js → register()

   POST /api/auth/login
     → Body: JSON { email, password }
     ← Returns: { user: {...}, accessToken: "eyJ..." }
     → Sets httpOnly refresh token cookie automatically
     → Backend: backend/controllers/authController.js → login()

   POST /api/auth/refresh
     → Cookie: refreshToken (httpOnly, sent automatically)
     ← Returns: { user: {...}, accessToken: "eyJ..." }
     → Backend: backend/controllers/authController.js → refreshToken()

   POST /api/auth/logout
     → Header: Authorization: Bearer <accessToken>
     ← Returns: { message: "Logged out" }
     → Clears httpOnly cookie + removes RT from MongoDB
     → Backend: backend/controllers/authController.js → logout()

   GET /api/auth/me
     → Header: Authorization: Bearer <accessToken>
     ← Returns: { user: {...} }
     → Backend: backend/controllers/authController.js → getMe()
     → (Optional — used if you need to re-fetch user profile after update)
   ───────────────────────────────────────────────────────────────────────────── */

import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("accessToken"));
  const [loading,     setLoading]     = useState(true);  // true until session restore attempt completes

  // ── Restore session on page load / refresh ────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // ── TODO: Backend route ───────────────────────────────────────────
        // POST /api/auth/refresh
        // Sends httpOnly RT cookie automatically — no body needed.
        // Returns: { user: {...}, accessToken: "eyJ..." }
        // Backend file: backend/controllers/authController.js → refreshToken()
        // ──────────────────────────────────────────────────────────────────
        const { data } = await api.post("/auth/refresh-token");
        const payload = data?.data || data;
        _setAuth(payload.user, payload.accessToken);
      } catch {
        // Refresh token expired / not present → remain logged out
        _clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Internal helpers ──────────────────────────────────────────────────────
  const _setAuth = (userData, token) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem("accessToken", token);
  };

  const _clearAuth = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("accessToken");
  };

  // ── login ─────────────────────────────────────────────────────────────────
  // ── TODO: Backend route ───────────────────────────────────────────────────
  // POST /api/auth/login
  // Body: { email: string, password: string }
  // Returns: { user: {...}, accessToken: "eyJ..." }
  // Also sets httpOnly refresh token cookie via Set-Cookie header.
  // Backend file: backend/controllers/authController.js → login()
  // ─────────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, username: email, password });
    const payload = data?.data || data;
    _setAuth(payload.user, payload.accessToken);
    return payload.user;
  };

  // ── register ──────────────────────────────────────────────────────────────
  // ── TODO: Backend route ───────────────────────────────────────────────────
  // POST /api/auth/register
  // Body: FormData { name, email, password, profilePhoto? (file, optional) }
  // IMPORTANT: must send as multipart/form-data (not JSON) because of photo.
  // Returns: { user: {...}, accessToken: "eyJ..." }
  // Backend file: backend/controllers/authController.js → register()
  // Middleware:   backend/middleware/uploadPhoto.js (Cloudinary multer)
  // ─────────────────────────────────────────────────────────────────────────
  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const payload = data?.data || data;
    _setAuth(payload.user, payload.accessToken);
    return payload.user;
  };

  // ── logout ────────────────────────────────────────────────────────────────
  // ── TODO: Backend route ───────────────────────────────────────────────────
  // POST /api/auth/logout
  // Header: Authorization: Bearer <accessToken>
  // Removes refresh token from MongoDB + clears httpOnly cookie.
  // Returns: { message: "Logged out successfully" }
  // Backend file: backend/controllers/authController.js → logout()
  // ─────────────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if server call fails, clear local state
    } finally {
      _clearAuth();
    }
  };

  // ── refreshUser — re-fetch profile after edits ────────────────────────────
  // ── TODO: Backend route ───────────────────────────────────────────────────
  // GET /api/auth/me
  // Header: Authorization: Bearer <accessToken>
  // Returns: { user: { _id, name, email, role, profilePhoto } }
  // Backend file: backend/controllers/authController.js → getMe()
  // Call this after profile updates to sync latest user data into context.
  // ─────────────────────────────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/current-user");
      const payload = data?.data || data;
      setUser(payload.user);
      return payload.user;
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    user,
    accessToken,
    loading,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    refreshUser,
    setUser,     // exposed so profile page can optimistically update avatar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}