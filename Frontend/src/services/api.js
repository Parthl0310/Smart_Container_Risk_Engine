/* ─────────────────────────────────────────────────────────────────────────────
   services/api.js
   ─────────────────────────────────────────────────────────────────────────────
   Central Axios instance used by every frontend service.

   What this file does:
     1. Creates an Axios instance pointing at your backend base URL
     2. Request interceptor — attaches JWT access token to every request
     3. Response interceptor — on 401 TOKEN_EXPIRED:
          a. Silently calls POST /api/auth/refresh (sends httpOnly RT cookie)
          b. Stores the new access token
          c. Retries the original failed request automatically
          d. If refresh also fails → logs out user, redirects to /login

   ── BACKEND API ENDPOINTS USED IN THIS FILE ──────────────────────────────────

   POST /api/auth/refresh
     → Cookie:  refreshToken (httpOnly, sent automatically by browser)
     ← Returns: { accessToken: "eyJ..." }
     → Used by: response interceptor to silently renew expired access tokens
     → Backend file: backend/controllers/authController.js → refreshToken()

   ─────────────────────────────────────────────────────────────────────────────
   All other endpoints are called from pages/hooks, not defined here.
   See individual files for their specific API routes.
   ───────────────────────────────────────────────────────────────────────────── */

import axios from "axios";

// ── TODO: Set this to your backend URL ───────────────────────────────────────
// Development : "http://localhost:5000/api"
// Production  : "https://your-deployed-backend.com/api"
// const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = "http://localhost:7000/api";

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // REQUIRED — sends httpOnly refresh token cookie
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ── MANUAL SINGLE ENTRY ANALYSIS ──
 * Sends a single shipment row to the AI engine for risk scoring.
 *
 * @param {Object} payload - The shipment data (container_id, origin, hs_code, weight, etc.)
 * @returns {Promise} - Axios promise with the analyzed container result.
 *
 * BACKEND DEV NOTE:
 * Expecting a POST request to /analyze/single or similar.
 * The backend should run the ML pipeline (XGBoost + SHAP) on this single JSON object
 * and save it to the database before returning the scored result.
 */
api.analyzeSingleRow = (payload) => api.post("/analyze/single", payload);

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — silent token refresh on 401 ───────────────────────
let isRefreshing = false;
let refreshQueue = [];   // queue of requests waiting for the new token

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  // Any 2xx — pass straight through
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 TOKEN_EXPIRED errors, not other 401s (wrong password etc.)
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry;   // prevent infinite retry loop

    if (!isTokenExpired) return Promise.reject(error);

    // Mark request so it won't be retried again
    originalRequest._retry = true;

    if (isRefreshing) {
      // Another request already refreshing — queue this one
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers["Authorization"] = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      // ── TODO: Backend route called here ──────────────────────────────────
      // POST /api/auth/refresh
      // The httpOnly refresh token cookie is sent automatically by the browser.
      // Backend: backend/controllers/authController.js → refreshToken()
      // Returns: { accessToken: "eyJ..." }
      // ─────────────────────────────────────────────────────────────────────
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const payload = data?.data || data;
      const newToken = payload.accessToken;
      localStorage.setItem("accessToken", newToken);

      // Notify all queued requests
      processQueue(null, newToken);

      // Retry the original request with the new token
      originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // Refresh failed (RT expired or revoked) — force logout
      processQueue(refreshError, null);
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;