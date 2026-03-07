/* ─────────────────────────────────────────────────────────────────────────────
   App.jsx
   ─────────────────────────────────────────────────────────────────────────────
   Root router. Wraps entire app in AuthProvider for global auth state.

   Route structure:
     /             → HomePage      (public — landing page, entry point)
     /login        → Login         (public)
     /register     → Register      (public)

     Protected (requires login):
       /dashboard  → Dashboard
       /results    → Results
       /profile    → AvatarUpload  (profile settings)

     Admin only (requires login + role === "admin"):
       /admin      → AdminPanel

     *             → redirect to /  (catch-all)

   Auth flow:
     New visitor      → /  → clicks "Get Started" → /register → /dashboard
     Returning user   → /  → clicks "Sign In"     → /login    → /dashboard
     Already logged in→ /  → auto-redirect         → /dashboard (in HomePage)

   ── FILES REFERENCED ─────────────────────────────────────────────────────────
   AuthContext  → context/AuthContext.jsx
   Routes       → pages/  and  components/
   ───────────────────────────────────────────────────────────────────────────── */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

// ── Pages ─────────────────────────────────────────────────────────────────────
import HomePage    from "./pages/HomePage";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import Dashboard   from "./pages/Dashboard";
import Results     from "./pages/Results";
import AdminPanel  from "./pages/AdminPanel";
import AvatarUpload from "./components/AvatarUpload";   // profile settings
import { ImageOff } from "lucide-react";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
        toastOptions={{
          style: {
            borderRadius: "12px",
            background: "#0f172a",
            color: "#fff",
            fontWeight: "600",
          },
        }}
      />
        <Routes>

          {/* ── Public routes ─────────────────────────────────────────────
              Anyone can visit these — no auth required.
              HomePage auto-redirects to /dashboard if already logged in.
          ─────────────────────────────────────────────────────────────── */}
          <Route path="/"         element={<HomePage />}  />
          <Route path="/login"    element={<Login />}     />
          <Route path="/register" element={<Register />}  />

          {/* ── Protected routes (must be logged in) ──────────────────────
              ProtectedRoute shows a loading spinner while session is
              being restored on page refresh, then redirects to /login
              if no valid token is found.
          ─────────────────────────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />}    />
            <Route path="/results"   element={<Results />}      />
            <Route path="/profile"   element={<AvatarUpload />} />
          </Route>

          {/* ── Admin-only routes ──────────────────────────────────────────
              AdminRoute checks role === "admin".
              Non-admin logged-in users are redirected to /dashboard.
          ─────────────────────────────────────────────────────────────── */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* ── Catch-all — redirect unknown paths to home ─────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}