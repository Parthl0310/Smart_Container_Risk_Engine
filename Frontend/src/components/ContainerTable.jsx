/* ─────────────────────────────────────────────────────────────────────────────
   components/ContainerTable.jsx
   ─────────────────────────────────────────────────────────────────────────────
   Reusable sortable, searchable, paginated table for container shipment data.

   Props:
     containers  Array    — list of container objects from MongoDB
     loading     Boolean  — show skeleton rows while fetching
     pageSize    Number   — rows per page (default 10)
     onRowClick  fn(c)    — optional: fires when a row is clicked
     showUser    Boolean  — show "Uploaded By" column (admin view only)
     users       Array    — user objects for showUser lookup

   No direct API call in this component.
   Data is passed in from parent (Results.jsx / Dashboard.jsx / AdminPanel.jsx)
   which use the useContainers() hook or direct api.get() calls.

   ── CONTAINER FIELDS DISPLAYED ───────────────────────────────────────────────
   All fields come from the containers MongoDB collection.

   API endpoints that supply this data:
     GET /api/results          → analyst, own containers
     GET /api/admin/results    → admin, all containers
   Backend files:
     backend/routes/results.js
     backend/controllers/adminController.js

   Updated container schema (MongoDB):
     anomaly   String | null  — human-readable anomaly description from ML
     action    String | null  — recommended action string from ML
     (replaces old Boolean anomaly_flag)
   ───────────────────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import RiskBadge from "./RiskBadge";
import ExplanationCard from "./ExplanationCard";

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  if (score == null) return <span className="text-secondary text-xs">—</span>;
  const pct        = Math.min(100, Math.max(0, score));
  const isHighRisk = pct >= 60;
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-border/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isHighRisk ? "bg-danger" : "bg-success"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-black font-mono ${isHighRisk ? "text-danger" : "text-success"}`}>
        {score}
      </span>
    </div>
  );
}

// ── Sort Icon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-slate-300 ml-1.5 text-[10px]">↕</span>;
  return (
    <span className="text-primary ml-1.5 text-[10px] font-bold">
      {sortDir === "asc" ? "↑" : "↓"}
    </span>
  );
}

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-2.5 bg-slate-100 rounded-full animate-pulse"
            style={{ width: `${50 + (i * 17) % 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PAGE = 10;

export default function ContainerTable({
  containers = [],
  loading     = false,
  pageSize    = DEFAULT_PAGE,
  onRowClick,
  showUser    = false,
  users       = [],
}) {
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [sortField, setSortField] = useState("uploadedAt");
  const [sortDir,   setSortDir]   = useState("desc");
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);   // container open in ExplanationCard

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // ── Filter + Search + Sort ────────────────────────────────────────────────
  const processed = useMemo(() => {
    let arr = [...containers];

    if (filter === "Critical")  arr = arr.filter(c => c.risk_level === "Critical");
    if (filter === "Low Risk")  arr = arr.filter(c => c.risk_level === "Low Risk");
    if (filter === "pending")   arr = arr.filter(c => !c.processed);
    if (filter === "anomaly")   arr = arr.filter(c => c.anomaly);    // String truthy check

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(c =>
        (c.container_id   || "").toLowerCase().includes(q) ||
        (c.origin_country || "").toLowerCase().includes(q) ||
        (c.hs_code        || "").toLowerCase().includes(q) ||
        (c.importer_id    || "").toLowerCase().includes(q)
      );
    }

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
  }, [containers, search, filter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paginated  = processed.slice((page - 1) * pageSize, page * pageSize);

  // ── User map for admin "Uploaded By" column ───────────────────────────────
  const userMap = useMemo(() => {
    const m = {};
    users.forEach(u => { m[u._id?.toString()] = u; });
    return m;
  }, [users]);

  // ── Column definitions ────────────────────────────────────────────────────
  const cols = [
    { key: "container_id",   label: "Container ID", sortable: true  },
    { key: "origin_country", label: "Origin",        sortable: true  },
    { key: "hs_code",        label: "HS Code",       sortable: true  },
    { key: "declared_value", label: "Value",         sortable: true  },
    { key: "risk_score",     label: "Score",         sortable: true  },
    { key: "risk_level",     label: "Level",         sortable: true  },
    { key: "anomaly",        label: "Anomaly",       sortable: false }, // String (was Boolean anomaly_flag)
    { key: "action",         label: "Action",        sortable: false }, // String — recommended action
    ...(showUser ? [{ key: "userId", label: "Uploaded By", sortable: false }] : []),
  ];

  // Filter pill counts
  const counts = {
    all:        containers.length,
    Critical:   containers.filter(c => c.risk_level === "Critical").length,
    "Low Risk": containers.filter(c => c.risk_level === "Low Risk").length,
    pending:    containers.filter(c => !c.processed).length,
    anomaly:    containers.filter(c => c.anomaly).length,   // String truthy check
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search ID, origin, HS code..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 transition-all font-medium"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(counts).map(([f, count]) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase rounded-xl transition-all flex items-center gap-2 border shadow-sm ${
                filter === f
                  ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                  : "bg-white border-border text-secondary hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {f === "all" ? "All Shipments" : f}
              <span className={`px-1.5 rounded-md text-[9px] ${
                filter === f ? "bg-white/20 text-white" : "bg-slate-100 text-secondary"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border/50 rounded-xl shadow-md overflow-hidden animate-in fade-in duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left">

            {/* Head */}
            <thead>
              <tr className="bg-slate-50/50 border-b border-border">
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-6 py-4 text-left text-secondary font-bold tracking-widest text-[10px] uppercase whitespace-nowrap select-none
                      ${col.sortable ? "cursor-pointer hover:text-slate-900 transition-colors" : ""}`}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {col.sortable && (
                        <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                      )}
                    </div>
                  </th>
                ))}
                {/* VIEW DETAILS button column */}
                <th className="px-6 py-4" />
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={cols.length + 1} />
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl">🔍</div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">No shipments found</p>
                        <p className="text-xs font-medium">Try adjusting your filters or search terms</p>
                      </div>
                      {(search || filter !== "all") && (
                        <button
                          onClick={() => { setSearch(""); setFilter("all"); }}
                          className="mt-2 text-xs font-bold text-primary hover:underline underline-offset-4"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((c, i) => {
                  const owner = showUser ? userMap[c.userId?.toString()] : null;
                  return (
                    <tr
                      key={c._id || i}
                      className={`group transition-all duration-200
                        ${c.risk_level === "Critical" ? "bg-red-50/20" : ""}
                        ${onRowClick ? "cursor-pointer hover:bg-slate-50/80" : "hover:bg-slate-50/40"}`}
                      onClick={() => onRowClick?.(c)}
                    >
                      {/* Container ID */}
                      <td className="px-6 py-4 font-mono font-bold text-primary text-xs whitespace-nowrap">
                        {c.container_id || "—"}
                      </td>

                      {/* Origin */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {c.origin_country || "—"}
                      </td>

                      {/* HS Code */}
                      <td className="px-6 py-4 font-mono text-xs font-medium text-slate-600">
                        {c.hs_code || "—"}
                      </td>

                      {/* Declared Value */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-900">
                        {c.declared_value != null
                          ? `$${Number(c.declared_value).toLocaleString()}`
                          : "—"}
                      </td>

                      {/* Risk Score bar */}
                      <td className="px-6 py-4">
                        <ScoreBar score={c.risk_score} />
                      </td>

                      {/* Risk Level badge */}
                      <td className="px-6 py-4">
                        <RiskBadge level={c.risk_level} />
                      </td>

                      {/* ── Anomaly (String) ────────────────────────────────
                          Source: Python ML → anomaly_detection.py
                          Stored: containers.anomaly (String | null)
                          e.g.  "Weight discrepancy of 340kg detected"
                          null  → show dash
                      ─────────────────────────────────────────────────────── */}
                      <td className="px-6 py-4 max-w-[190px]">
                        {c.anomaly
                          ? <span className="inline-block text-amber-700 font-semibold text-[10px] bg-amber-50 px-2 py-1 rounded-md border border-amber-100 leading-relaxed line-clamp-2">
                              ⚠ {c.anomaly}
                            </span>
                          : <span className="text-slate-300 font-medium">—</span>}
                      </td>

                      {/* ── Action (String) ─────────────────────────────────
                          Source: Python ML → explain.py
                          Stored: containers.action (String | null)
                          e.g.  "Immediate physical inspection recommended"
                                "Clear for processing"
                          Color: red if Critical, green if Low Risk
                      ─────────────────────────────────────────────────────── */}
                      <td className="px-6 py-4 max-w-[190px]">
                        {c.action
                          ? <span className={`inline-block text-[10px] font-semibold px-2 py-1 rounded-md border leading-relaxed line-clamp-2 ${
                              c.risk_level === "Critical"
                                ? "text-red-700 bg-red-50 border-red-100"
                                : "text-emerald-700 bg-emerald-50 border-emerald-100"
                            }`}>
                              {c.action}
                            </span>
                          : <span className="text-slate-300 font-medium">—</span>}
                      </td>

                      {/* Uploaded By (admin only) */}
                      {showUser && (
                        <td className="px-6 py-4">
                          {owner ? (
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-sm">
                                {owner.profilePhoto?.url
                                  ? <img src={owner.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                                  : <span className="text-[10px]">👤</span>}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{owner.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      )}

                      {/* VIEW DETAILS button — opens ExplanationCard modal */}
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setSelected(c)}
                          className="inline-flex items-center justify-center text-[10px] font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0"
                        >
                          VIEW DETAILS
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer / Pagination ── */}
        {!loading && processed.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30 gap-4">
            <p className="text-[11px] font-bold text-secondary">
              {processed.length === containers.length
                ? `Total ${processed.length} shipments`
                : `Showing ${processed.length} of ${containers.length} shipments`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-border text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >←</button>
                <div className="flex items-center gap-1.5 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    if (p < 1 || p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-xl transition-all ${
                          p === page
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-white border border-border text-secondary hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-border text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                >→</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ExplanationCard modal — opens on VIEW DETAILS click ── */}
      {selected && (
        <ExplanationCard
          container={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}