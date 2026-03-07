// import dotenv from "dotenv";
// import { fileURLToPath } from "url";
// import { dirname, join } from "path";

// const __dirname = dirname(fileURLToPath(import.meta.url));
// dotenv.config({ path: join(__dirname, "..", ".env") });
// console.log("PORT:", process.env.PORT);
// console.log("MONGODB_URI:", process.env.MONGODB_URI ? "loaded" : "MISSING");

// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { ApiError } from "./utils/ApiError.js";

// const app = express();

// // ── Silence Chrome DevTools probe ─────────────────────────────────────────────
// // Prevents "Failed to load resource" 404 noise in browser console
// app.use("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) =>
//   res.status(204).end()
// );

// // ── Content Security Policy ───────────────────────────────────────────────────
// // Updated to allow:
// //   - Cloudinary images (profilePhoto URLs)
// //   - API calls to localhost ports used by frontend (5173 / 3000)
// //   - Inline styles (Tailwind CSS uses them)
// app.use((_req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     [
//       "default-src 'self'",
//       "script-src 'self' 'unsafe-inline'",
//       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
//       "font-src 'self' https://fonts.gstatic.com",
//       // Cloudinary for profile photos + data URIs for avatar previews
//       "img-src 'self' data: blob: https://res.cloudinary.com",
//       // Allow frontend to call backend API and Cloudinary upload endpoint
//       "connect-src 'self' http://localhost:5000 http://localhost:8000 https://api.cloudinary.com",
//     ].join("; ")
//   );
//   next();
// });

// // ── CORS ──────────────────────────────────────────────────────────────────────
// // credentials: true requires exact origin — never wildcard "*"
// // CORS_ORIGIN in .env can be comma-separated list:
// //   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
// const allowedOrigins = process.env.CORS_ORIGIN
//   ? process.env.CORS_ORIGIN.split(",")
//       .map((o) => o.trim())
//       .filter((o) => o && o !== "*")
//   : [
//       "http://localhost:5173", // Vite default
//       "http://localhost:5174", // Vite alt port
//       "http://localhost:3000", // CRA default
//     ];

// function corsOrigin(origin, cb) {
//   // Requests with no origin (Postman, curl, server-to-server) — allow
//   if (!origin) return cb(null, allowedOrigins[0]);
//   if (allowedOrigins.includes(origin)) return cb(null, origin);
//   // Unknown origin — block
//   return cb(null, false);
// }

// app.use(
//   cors({
//     origin: corsOrigin,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Ensure CORS headers survive error responses (4xx / 5xx)
// app.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//   }
//   next();
// });

// // ── Body parsers + static ─────────────────────────────────────────────────────
// app.use(express.json({ limit: "16kb" }));
// app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// app.use(express.static("public"));
// app.use(cookieParser());

// // ── Routes ────────────────────────────────────────────────────────────────────
// import userRouter      from "./routes/user.routes.js";
// import containerRouter from "./routes/container.routes.js";

// // ── Health check endpoints ────────────────────────────────────────────────────
// // Fixes "Cannot GET /" and gives a quick API reference
// app.get("/", (_req, res) =>
//   res.json({
//     ok: true,
//     message: "SmartContainer Backend API",
//     version: "1.0.0",
//     docs: "/api",
//   })
// );

// app.get("/api", (_req, res) =>
//   res.json({
//     ok: true,
//     message: "API root",
//     endpoints: {
//       auth:      "/api/auth          — login, register, refresh, logout, me",
//       users:     "/api/v1/users      — profile update, photo upload",
//       container: "/api/v1/container  — upload CSV, results, predict, admin",
//     },
//   })
// );

// // ── Auth routes ───────────────────────────────────────────────────────────────
// // Frontend AuthContext.jsx calls:
// //   POST /api/auth/login
// //   POST /api/auth/register
// //   POST /api/auth/refresh
// //   POST /api/auth/logout
// //   GET  /api/auth/me
// //   PUT  /api/auth/profile
// //   PUT  /api/auth/profile/photo
// //   DELETE /api/auth/profile/photo
// //   PUT  /api/auth/profile/password
// app.use("/api/auth", userRouter);

// // ── User profile routes (versioned alias) ─────────────────────────────────────
// // Same router — kept for any direct /api/v1/users calls
// app.use("/api/v1/users", userRouter);

// // ── Container routes ──────────────────────────────────────────────────────────
// // Frontend api.js calls:
// //   POST   /api/v1/container/upload         — CSV upload (UploadCSV.jsx)
// //   GET    /api/v1/container/results        — analyst results (useContainers.js)
// //   GET    /api/v1/container/admin/results  — admin all results (AdminPanel.jsx)
// //   GET    /api/v1/container/admin/users    — admin all users (AdminPanel.jsx)
// //   POST   /api/v1/container/predict/:batchId — trigger ML scoring (Results.jsx)
// app.use("/api/v1/container", containerRouter);

// // ── 404 handler ───────────────────────────────────────────────────────────────
// // Catches any route not matched above
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `Route ${req.method} ${req.originalUrl} not found`,
//   });
// });

// // ── Global error handler ──────────────────────────────────────────────────────
// // Re-applies CORS headers so errors never strip them
// // ApiError is your custom error class from utils/ApiError.js
// app.use((err, req, res, next) => {
//   const origin = req.headers.origin;
//   if (origin && allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     res.setHeader("Access-Control-Allow-Credentials", "true");
//   }

//   const statusCode = err.statusCode || 500;

//   res.status(statusCode).json({
//     success: false,
//     message: err.message || "Internal server error",
//     ...(err instanceof ApiError && err.error ? { error: err.error } : {}),
//   });
// });

// export { app };











// ─────────────────────────────────────────────────────────────────────────────
// src/app.js
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: dotenv is loaded by nodemon via "-r dotenv/config" in package.json
// scripts. Do NOT call dotenv.config() here — it would run AFTER all ESM
// imports are hoisted, making it useless and causing double-load warnings.
//
// All process.env variables are available by the time this file executes.
// ─────────────────────────────────────────────────────────────────────────────

// ── All imports at the top (ESM hoists these before any code runs) ────────────
import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";

import userRouter      from "./routes/user.routes.js";
import containerRouter from "./routes/container.routes.js";

import { ApiError } from "./utils/ApiError.js";

// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ── Silence Chrome DevTools probe ────────────────────────────────────────────
// Chrome auto-probes this URL on every localhost port — return 204 to silence
// the "Failed to load resource 404" noise in the browser console.
app.get(
  "/.well-known/appspecific/com.chrome.devtools.json",
  (_req, res) => res.status(204).end()
);

// ── Content Security Policy ───────────────────────────────────────────────────
// Allows Cloudinary (profile photos), Google Fonts, blob/data URIs (avatars),
// and calls to the Python ML service on port 8000.
app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "connect-src 'self' http://localhost:5000 http://localhost:8000 https://api.cloudinary.com",
    ].join("; ")
  );
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// credentials:true requires exact origin — never wildcard "*"
// Set in .env:  CORS_ORIGIN=http://localhost:5173,http://localhost:3000
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter((o) => o && o !== "*")
  : [
      "http://localhost:5173", // Vite default
      "http://localhost:5174", // Vite alt port
      "http://localhost:3000", // CRA / fallback
    ];

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, allowedOrigins[0]); // Postman / curl — allow
  if (allowedOrigins.includes(origin)) return cb(null, origin);
  return cb(null, false); // Unknown origin — block
}

app.use(
  cors({
    origin:         corsOrigin,
    credentials:    true,
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Re-apply CORS headers on every response including errors
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  next();
});

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ── Health check ──────────────────────────────────────────────────────────────
// GET http://localhost:5000/  →  confirms server is alive
// If this returns 404, one of the route imports above crashed on load.
app.get("/", (_req, res) =>
  res.status(200).json({
    ok:      true,
    message: "SmartContainer Backend API",
    version: "1.0.0",
    status:  "running",
    docs:    "GET /api",
  })
);

// GET http://localhost:5000/api  →  lists all available endpoints
app.get("/api", (_req, res) =>
  res.status(200).json({
    ok:      true,
    message: "API root",
    endpoints: {
      "POST   /api/auth/register":                   "Register new user",
      "POST   /api/auth/login":                      "Login → accessToken + RT cookie",
      "POST   /api/auth/refresh":                    "Silent token refresh",
      "POST   /api/auth/logout":                     "Logout",
      "GET    /api/auth/me":                         "Current user profile",
      "PUT    /api/auth/profile":                    "Update name + email",
      "PUT    /api/auth/profile/photo":              "Upload profile photo",
      "DELETE /api/auth/profile/photo":              "Remove profile photo",
      "PUT    /api/auth/profile/password":           "Change password",
      "POST   /api/v1/container/upload":             "Upload CSV batch",
      "GET    /api/v1/container/results":            "Own containers (analyst)",
      "GET    /api/v1/container/analytics":          "Risk analytics for charts",
      "POST   /api/v1/container/predict/:batchId":   "Trigger ML scoring",
      "GET    /api/v1/container/admin/results":      "All containers (admin)",
      "GET    /api/v1/container/admin/users":        "All users (admin)",
    },
  })
);

// ── Auth + user profile routes ────────────────────────────────────────────────
app.use("/api/auth",     userRouter);
app.use("/api/v1/users", userRouter);  // versioned alias

// ── Container routes ──────────────────────────────────────────────────────────
app.use("/api/v1/container", containerRouter);

// ── 404 — no route matched ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// 4-param signature required for Express to treat this as error handler
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(err instanceof ApiError && err.error ? { error: err.error } : {}),
  });
});

export { app };