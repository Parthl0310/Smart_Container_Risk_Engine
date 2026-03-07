// import { Router } from "express";

// import {
//   uploadContainerCSV,
//   createSingleContainer,
//   getUserContainers,
//   getContainerById,
//   updatePrediction,
//   getRiskAnalytics
// } from "../controllers/container.controller.js";

// import { upload } from "../middlewares/multer.middleware.js";
// import { verifyJWT } from "../middlewares/auth.middleware.js";

// const router = Router();

// /*
// UPLOAD CSV FILE
// */
// router.post(
//   "/upload",
//   verifyJWT,
//   upload.single("file"),
//   uploadContainerCSV
// );

// /*
// MANUAL CONTAINER ENTRY
// */
// router.post(
//   "/create",
//   verifyJWT,
//   createSingleContainer
// );

// /*
// GET ALL CONTAINERS OF CURRENT USER
// */
// router.get(
//   "/",
//   verifyJWT,
//   getUserContainers
// );

// /*
// GET RISK ANALYTICS
// */
// router.get(
//   "/analytics",
//   verifyJWT,
//   getRiskAnalytics
// );

// /*
// UPDATE ML PREDICTION
// */
// router.patch(
//   "/prediction/:id",
//   verifyJWT,
//   updatePrediction
// );

// /*
// GET SINGLE CONTAINER
// */
// router.get(
//   "/:id",
//   verifyJWT,
//   getContainerById
// );

// export default router;









import { Router } from "express";

import {
  uploadContainerCSV,
  createSingleContainer,
  getUserContainers,
  getContainerById,
  updatePrediction,
  getRiskAnalytics,
} from "../controllers/container.controller.js";

import { upload }     from "../middlewares/multer.middleware.js";
import { verifyJWT }  from "../middlewares/auth.middleware.js";

// ── TODO: Create these admin controller functions ─────────────────────────────
// File: src/controllers/admin.controller.js
// OR add them directly to container.controller.js
import {
  getAllContainersAdmin,
  getAllUsersAdmin,
} from "../controllers/admin.controller.js";

const router = Router();

// ═════════════════════════════════════════════════════════════════════════════
// CONTAINER ROUTES
// Base path: /api/v1/container  (mounted in app.js)
// ═════════════════════════════════════════════════════════════════════════════

// ── Upload CSV ────────────────────────────────────────────────────────────────
// Called by: UploadCSV.jsx → POST /api/v1/container/upload
// Body: multipart/form-data with field "file" (.csv or .xlsx)
// Returns: { batchId, count }
router.post(
  "/upload",
  verifyJWT,
  upload.single("file"),
  uploadContainerCSV
);

// ── Manual single container entry ─────────────────────────────────────────────
// Called by: (optional manual form)
// Body: JSON container fields
router.post(
  "/create",
  verifyJWT,
  createSingleContainer
);

// ── Get own containers (analyst view) ─────────────────────────────────────────
// Called by: useContainers.js → GET /api/v1/container/results
// Returns: { containers: [...] } — only containers belonging to req.user._id
router.get(
  "/results",
  verifyJWT,
  getUserContainers   // filter by userId === req.user._id in controller
);

// ── Risk analytics ────────────────────────────────────────────────────────────
// Called by: Dashboard.jsx charts
// Returns: { total, critical, lowRisk, byCountry, byMonth }
router.get(
  "/analytics",
  verifyJWT,
  getRiskAnalytics
);

// ── ML prediction trigger ─────────────────────────────────────────────────────
// Called by: Results.jsx → POST /api/v1/container/predict/:batchId
// Sends batch to Python ML service (localhost:8000) and saves results back
// Returns: { scored, batchId }
// TODO: implement in container.controller.js → calls Python FastAPI
router.post(
  "/predict/:batchId",
  verifyJWT,
  updatePrediction    // or create a new triggerPrediction controller
);

// ── Update single container prediction ───────────────────────────────────────
// Called by: internal / admin manual override
// Body: { risk_score, risk_level, anomaly, action, explanation_summary }
router.patch(
  "/prediction/:id",
  verifyJWT,
  updatePrediction
);

// ── Admin: get ALL containers from ALL users ──────────────────────────────────
// Called by: AdminPanel.jsx + useContainers.js (isAdmin) → GET /api/v1/container/admin/results
// Requires: role === "admin" (checked in controller or add adminOnly middleware)
// Returns: { containers: [...] } — every container in DB
router.get(
  "/admin/results",
  verifyJWT,
  getAllContainersAdmin
);

// ── Admin: get ALL users ──────────────────────────────────────────────────────
// Called by: AdminPanel.jsx → GET /api/v1/container/admin/users
// Requires: role === "admin"
// Returns: { users: [...] }
router.get(
  "/admin/users",
  verifyJWT,
  getAllUsersAdmin
);

// ── Get single container by ID ────────────────────────────────────────────────
// Called by: ExplanationCard detail fetch (optional)
// Params: :id — MongoDB _id of the container
router.get(
  "/:id",
  verifyJWT,
  getContainerById
);

// ── Legacy root GET (kept for backward compat) ────────────────────────────────
// GET /api/v1/container/ — same as /results
router.get(
  "/",
  verifyJWT,
  getUserContainers
);

export default router;