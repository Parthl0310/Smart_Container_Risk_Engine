/* ─────────────────────────────────────────────────────────────────────────────
   hooks/useContainers.js
   ─────────────────────────────────────────────────────────────────────────────
   Custom hook that fetches container results from the backend and exposes
   filtering, searching, and pagination controls.

   Used by:
     Results.jsx      — analyst view (own containers only)
     Dashboard.jsx    — summary stats + recent 5 containers
     AdminPanel.jsx   — all containers across all users (admin only)

   Returns:
     containers   Array    — filtered + sorted containers for current page
     allContainers Array   — raw unfiltered list (used for stat counts)
     loading      Boolean  — true while fetching
     error        String   — error message if fetch failed
     summary      Object   — { total, critical, lowRisk, pending, anomaly }
     search       String   — current search term
     setSearch    Function — update search term (resets to page 1)
     filter       String   — "all"|"Critical"|"Low Risk"|"pending"|"anomaly"
     setFilter    Function — update filter (resets to page 1)
     sortField    String   — current sort column key
     sortDir      String   — "asc" | "desc"
     handleSort   Function — toggle sort on a column
     page         Number   — current page number
     setPage      Function — jump to a page
     totalPages   Number   — total pages for current filtered set
     refetch      Function — manually re-fetch (e.g. after CSV upload)

   ── BACKEND API ENDPOINTS USED IN THIS HOOK ──────────────────────────────────

   GET /api/results
     → Header: Authorization: Bearer <accessToken>
     ← Returns: { containers: [...] }
     → Analyst: returns only containers where userId === req.user.id
     → Backend: backend/controllers/uploadController.js (results route)
     → Backend file: backend/routes/results.js

   GET /api/admin/results
     → Header: Authorization: Bearer <accessToken>
     → Requires: role === "admin"
     ← Returns: { containers: [...] }  (ALL containers from all users)
     → Backend: backend/controllers/adminController.js
     → Backend file: backend/routes/admin.js

   ── OPTIONAL QUERY PARAMS (add to backend if needed) ─────────────────────────
   GET /api/results?batchId=abc123    → filter by upload batch
   GET /api/admin/results?userId=xyz  → filter by specific user (admin only)
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const PAGE_SIZE_DEFAULT = 10;

export default function useContainers(pageSize = PAGE_SIZE_DEFAULT) {
  const { isAdmin } = useAuth();

  const [allContainers, setAllContainers] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearchRaw]     = useState("");
  const [filter,        setFilterRaw]     = useState("all");
  const [sortField,     setSortField]     = useState("uploadedAt");
  const [sortDir,       setSortDir]       = useState("desc");
  const [page,          setPage]          = useState(1);

  // ── Fetch containers from backend ─────────────────────────────────────────
  const fetchContainers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // ── TODO: Backend route ─────────────────────────────────────────────
      // Analyst → GET /api/results
      //   Returns only containers belonging to the logged-in user (userId filter
      //   applied server-side in backend/controllers/uploadController.js)
      //
      // Admin   → GET /api/admin/results
      //   Returns ALL containers from ALL users
      //   Requires role === "admin" (enforced by adminOnly middleware)
      //   Backend file: backend/controllers/adminController.js
      // ────────────────────────────────────────────────────────────────────
      const endpoint = isAdmin ? "/admin/results" : "/results";
      const { data } = await api.get(endpoint);
      setAllContainers(data.containers || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load containers.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Fetch on mount and whenever isAdmin changes
  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  // ── Setters that reset page to 1 ─────────────────────────────────────────
  const setSearch = (val) => { setSearchRaw(val);  setPage(1); };
  const setFilter = (val) => { setFilterRaw(val);  setPage(1); };

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }, [sortField]);

  // ── Derived: filtered + sorted list ──────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = [...allContainers];

    // Filter by risk level / status
    if (filter === "Critical")  arr = arr.filter(c => c.risk_level === "Critical");
    if (filter === "Low Risk")  arr = arr.filter(c => c.risk_level === "Low Risk");
    if (filter === "pending")   arr = arr.filter(c => !c.processed);
    if (filter === "anomaly")   arr = arr.filter(c => c.anomaly);   // String truthy check

    // Search across key fields
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(c =>
        (c.container_id    || "").toLowerCase().includes(q) ||
        (c.origin_country  || "").toLowerCase().includes(q) ||
        (c.hs_code         || "").toLowerCase().includes(q) ||
        (c.importer_id     || "").toLowerCase().includes(q) ||
        (c.anomaly         || "").toLowerCase().includes(q) ||
        (c.action          || "").toLowerCase().includes(q)
      );
    }

    // Sort
    arr.sort((a, b) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return arr;
  }, [allContainers, filter, search, sortField, sortDir]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const containers = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const summary = useMemo(() => ({
    total:    allContainers.length,
    critical: allContainers.filter(c => c.risk_level === "Critical").length,
    lowRisk:  allContainers.filter(c => c.risk_level === "Low Risk").length,
    pending:  allContainers.filter(c => !c.processed).length,
    anomaly:  allContainers.filter(c => c.anomaly).length,
  }), [allContainers]);

  return {
    // Data
    containers,      // paginated + filtered (use in table)
    allContainers,   // raw full list (use for charts / stats)
    loading,
    error,
    summary,

    // Search & Filter
    search,   setSearch,
    filter,   setFilter,

    // Sort
    sortField, sortDir, handleSort,

    // Pagination
    page, setPage, totalPages,

    // Refetch (call after upload or predict)
    refetch: fetchContainers,
  };
}