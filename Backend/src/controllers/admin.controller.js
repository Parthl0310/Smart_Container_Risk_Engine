// ─────────────────────────────────────────────────────────────────────────────
// controllers/admin.controller.js
// ─────────────────────────────────────────────────────────────────────────────
// Admin-only controllers.
// All functions here require role === "admin" — enforced by checking req.user.role.
//
// Called by:
//   GET /api/v1/container/admin/results  → getAllContainersAdmin
//   GET /api/v1/container/admin/users    → getAllUsersAdmin
// ─────────────────────────────────────────────────────────────────────────────

import { Container } from "../models/container.model.js";
import { User }      from "../models/user.model.js";
import { ApiError }  from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ── Helper — check admin role ─────────────────────────────────────────────────
const requireAdmin = (req) => {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Access denied. Admin role required.");
  }
};

// ── GET /api/v1/container/admin/results ───────────────────────────────────────
// Returns ALL containers across ALL users.
// Optional query param: ?userId=xxx  → filter by a specific user
//
// Response: { containers: [...] }
const getAllContainersAdmin = async (req, res, next) => {
  try {
    requireAdmin(req);

    const filter = {};

    // Optional: filter by specific user (used in AdminPanel UserDrawer)
    // GET /api/v1/container/admin/results?userId=64abc123
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // Optional: filter by batch
    // GET /api/v1/container/admin/results?batchId=abc123
    if (req.query.batchId) {
      filter.uploadBatchId = req.query.batchId;
    }

    const containers = await Container.find(filter)
      .sort({ uploadedAt: -1 })  // newest first
      .lean();                    // plain JS objects — faster than Mongoose docs

    return res.status(200).json(
      new ApiResponse(200, { containers }, "All containers fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

// ── GET /api/v1/container/admin/users ─────────────────────────────────────────
// Returns ALL users (without passwords).
// Used by AdminPanel.jsx to show user list and container counts.
//
// Response: { users: [...] }
const getAllUsersAdmin = async (req, res, next) => {
  try {
    requireAdmin(req);

    const users = await User.find({})
      .select("-password -refreshToken")  // never send sensitive fields
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(
      new ApiResponse(200, { users }, "All users fetched successfully")
    );
  } catch (err) {
    next(err);
  }
};

export { getAllContainersAdmin, getAllUsersAdmin };