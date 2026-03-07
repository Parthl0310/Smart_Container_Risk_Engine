import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Loading Spinner ───────────────────────────────────────────────────────────
function AuthLoader() {
  return (
    <div className="min-h-screen bg-[#05090f] flex flex-col items-center justify-center gap-4">
      {/* Animated hex icon */}
      <div className="relative w-12 h-12">
        <div
          className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#0099bb] animate-pulse"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        />
      </div>
      <p className="text-[10px] tracking-[0.25em] uppercase text-[#3d5a7a] font-mono animate-pulse">
        Verifying session...
      </p>
    </div>
  );
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// Wraps any route that requires the user to be logged in.
// If loading  → show spinner (prevents flash redirect on page refresh)
// If no user  → redirect to /login
// If user ok  → render child route via <Outlet />
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoader />;
  if (!user)   return <Navigate to="/login" replace />;

  return <Outlet />;
}

// ── AdminRoute ────────────────────────────────────────────────────────────────
// Wraps any route that requires admin role.
// If loading     → show spinner
// If no user     → redirect to /login
// If not admin   → redirect to /dashboard (silently, not a hard error)
// If admin ok    → render child route via <Outlet />
export function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();

  if (loading)   return <AuthLoader />;
  if (!user)     return <Navigate to="/login" replace />;
  if (!isAdmin)  return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}