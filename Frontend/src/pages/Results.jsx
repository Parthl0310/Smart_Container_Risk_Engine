import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";
import ExplanationCard from "../components/ExplanationCard";

// ── Score Bar (Light Theme) ──────────────────────────────────────────────────
function ScoreBar({ score }) {
  if (score == null) return <span className="text-secondary text-xs">—</span>;
  const pct = Math.min(100, Math.max(0, score));
  const isHighRisk = pct >= 60;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${isHighRisk ? 'bg-red-500' : 'bg-emerald-500'}`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <span className={`text-[10px] font-bold font-mono ${isHighRisk ? 'text-red-600' : 'text-emerald-600'}`}>{score}</span>
    </div>
  );
}

// ── Sort Icon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-slate-300 ml-1.5 text-[10px]">↕</span>;
  return <span className="text-primary ml-1.5 text-[10px] font-bold">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

const PAGE_SIZE = 10;

function normalizeContainer(c) {
  return {
    ...c,
    container_id: c.container_id ?? c.Container_ID,
    origin_country: c.origin_country ?? c.Origin_Country,
    hs_code: c.hs_code ?? c.HS_Code,
    declared_value: c.declared_value ?? c.Declared_Value,
    declared_weight: c.declared_weight ?? c.Declared_Weight,
    measured_weight: c.measured_weight ?? c.Measured_Weight,
    risk_score: c.risk_score ?? c.riskScore,
    risk_level: c.risk_level ?? c.riskLevel,
    explanation_summary: c.explanation_summary ?? c.explanationSummary,
    trade_regime: c.trade_regime ?? c["Trade_Regime (Import / Export / Transit)"],
    destination_country: c.destination_country ?? c.Destination_Country,
    destination_port: c.destination_port ?? c.Destination_Port,
    importer_id: c.importer_id ?? c.Importer_ID,
    exporter_id: c.exporter_id ?? c.Exporter_ID,
    shipping_line: c.shipping_line ?? c.Shipping_Line,
    dwell_time_hours: c.dwell_time_hours ?? c.Dwell_Time_Hours,
    declaration_date: c.declaration_date ?? c["Declaration_Date (YYYY-MM-DD)"],
    declaration_time: c.declaration_time ?? c.Declaration_Time,
    processed: c.processed ?? !!(c.riskScore ?? c.risk_score),
  };
}

export default function Results() {
  const { isAdmin } = useAuth();

  const [containers, setContainers] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all"); 
  const [sortField,  setSortField]  = useState("createdAt");
  const [sortDir,    setSortDir]    = useState("desc");
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState(null);   
  const [runningId,  setRunningId]  = useState(null);   

  useEffect(() => {
    const fetchContainers = async () => {
      setLoading(true);
      try {
        const endpoint = "/v1/container/";
        const { data } = await api.get(endpoint);
        const payload = data?.data ?? data;
        setContainers(Array.isArray(payload) ? payload : (payload?.containers || []));
      } catch (err) {
        console.error("Results fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContainers();
  }, [isAdmin]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const runPrediction = async (batchId) => {
    setRunningId(batchId);
    try {
      await api.post(`/predict/${batchId}`);
      const { data } = await api.get("/v1/container/");
      const payload = data?.data ?? data;
      setContainers(Array.isArray(payload) ? payload : (payload?.containers || []));
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setRunningId(null);
    }
  };

  const exportCSV = () => {
    // const headers = ["container_id","origin_country","hs_code","declared_value","declared_weight","measured_weight","risk_score","risk_level","anomaly_flag","explanation_summary"];
    const headers = [
  "Container_ID",
  "Declaration_Date (YYYY-MM-DD)",
  "Declaration_Time",
  "Trade_Regime (Import / Export / Transit)",
  "Origin_Country",
  "Destination_Port",
  "Destination_Country",
  "HS_Code",
  "Importer_ID",
  "Exporter_ID",
  "Declared_Value",
  "Declared_Weight",
  "Measured_Weight",
  "Shipping_Line",
  "Dwell_Time_Hours",
  "Clearance_Status",
  "hour",
  "weekday",
  "weight_difference",
  "weight_diff_percent",
  "high_weight_mismatch",
  "value_per_weight",
  "low_value_risk",
  "hs_prefix",
  "high_risk_hs",
  "importer_shipments",
  "exporter_shipments",
  "new_importer",
  "new_exporter",
  "night_shipment",
  "weekend_flag",
  "long_dwell_time",
  "cargo_density",
  "high_value_cargo",
  "Weight_Deviation_Percent",
  "Rule_Risk_Score",
  "Weight_Diff",
  "Feature_Risk_Score",
  "Final_Risk_Score",
  "Risk_Category",
  "anomalies",
  "anomaly_text",
  "pattern",
  "Risk_Explanation"
];
    const rows = filtered.map(c =>
      headers.map(h => JSON.stringify(c[h] ?? "")).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `risk_results_${Date.now()}.csv`;
    a.click();
  };

  const filtered = useMemo(() => {
    let arr = containers.map(normalizeContainer);
    if (filter === "Critical")  arr = arr.filter(c => (c.risk_level || c.riskLevel) === "Critical" || (c.risk_level || c.riskLevel) === "High");
    if (filter === "Low Risk")  arr = arr.filter(c => (c.risk_level || c.riskLevel) === "Low" || (c.risk_level || c.riskLevel) === "Low Risk");
    if (filter === "pending")   arr = arr.filter(c => !c.processed);

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(c =>
        (c.container_id || "").toLowerCase().includes(q) ||
        (c.origin_country || "").toLowerCase().includes(q) ||
        (c.hs_code || "").toLowerCase().includes(q) ||
        (c.importer_id || "").toLowerCase().includes(q)
      );
    }

    arr.sort((a, b) => {
      let av = a[sortField] ?? "";
      let bv = b[sortField] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [containers, search, filter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingBatches = [...new Set(
    containers.filter(c => !c.processed).map(c => c.uploadBatchId)
  )].filter(Boolean);

  const COLS = [
    { key: "container_id",   label: "Container ID" },
    { key: "origin_country", label: "Origin" },
    { key: "hs_code",        label: "HS Code" },
    { key: "declared_value", label: "Value" },
    { key: "risk_score",     label: "Score" },
    { key: "risk_level",     label: "Level" },
    // { key: "anomaly_flag",   label: "Anomaly" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-text">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-3">
              <span className="w-6 h-px bg-primary"></span>
              Cargo Intelligence Lab
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Risk Audit <span className="text-secondary font-medium">History</span>
            </h1>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-orange-400 border border-border hover:bg-slate-50 text-slate-700  font-black tracking-widest uppercase rounded-2xl transition-all shadow-sm active:scale-95 animate-in fade-in slide-in-from-right-4 duration-700"
          >
            ↓ Export Analysis CSV
          </button>
        </div>

        {/* ── Pending Predictions Banner ── */}
        {pendingBatches.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl px-6 py-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl animate-pulse">⚡</div>
              <div>
                <p className="text-sm font-black text-amber-700 tracking-tight">
                  {pendingBatches.length} Logistics Batch{pendingBatches.length > 1 ? "es" : ""} In Queue
                </p>
                <p className="text-xs font-medium text-amber-600/80 mt-1">Awaiting machine learning validation and SHAP analysis.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {pendingBatches.slice(0, 3).map(batchId => (
                <button
                  key={batchId}
                  onClick={() => runPrediction(batchId)}
                  disabled={runningId === batchId}
                  className="px-4 py-2 text-[10px] font-black tracking-widest uppercase bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 disabled:opacity-50"
                >
                  {runningId === batchId ? "Analyzing..." : `Scan ${batchId.slice(-6)}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Filter + Search Bar ── */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8">
          <div className="relative flex-1 max-w-md animate-in fade-in duration-700">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍︎</span>
            <input
              type="text" placeholder="Search by ID, origin, HS code..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-700 placeholder-slate-400 transition-all font-medium shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 animate-in fade-in duration-700 delay-100">
            {["all", "Critical", "Low Risk", "pending"].map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-5 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all border shadow-sm ${
                  filter === f
                    ? "bg-orange-400 text-white border-primary shadow-primary/20 scale-105"
                    : "bg-white border-border text-secondary hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {f === "all" ? "Full Catalog" : f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[10px] font-black tracking-[0.2em] text-secondary uppercase">Retrieving Audit Trails...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl">🔎</div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-900">No matches found</p>
                <p className="text-xs font-medium text-secondary mt-1">Refine your audit filters</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-border">
                    {COLS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-8 py-5 text-secondary font-black tracking-widest text-[9px] uppercase cursor-pointer hover:text-slate-900 transition-colors select-none whitespace-nowrap"
                      >
                        <div className="flex items-center">
                          {col.label}
                          <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                        </div>
                      </th>
                    ))}
                    <th className="px-8 py-5 text-secondary font-black tracking-widest text-[9px] uppercase">
                      Insight
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((c, i) => (
                    <tr
                      key={c._id || i}
                      className={`group hover:bg-slate-50/80 transition-all duration-200 ${(c.risk_level || c.riskLevel) === 'Critical' || (c.risk_level || c.riskLevel) === 'High' ? 'bg-red-50/10' : ''}`}
                    >
                      <td className="px-8 py-5 font-mono font-bold text-primary text-xs whitespace-nowrap">{c.container_id ?? c.Container_ID ?? "—"}</td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-700">{c.origin_country ?? c.Origin_Country ?? "—"}</td>
                      <td className="px-8 py-5 font-mono text-xs font-semibold text-slate-500">{c.hs_code ?? c.HS_Code ?? "—"}</td>
                      <td className="px-8 py-5 text-xs font-black text-slate-900">
                        {(c.declared_value ?? c.Declared_Value) != null ? `$${Number(c.declared_value ?? c.Declared_Value).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-8 py-5"><ScoreBar score={c.risk_score ?? c.riskScore} /></td>
                      <td className="px-8 py-5">
                        {(c.risk_level ?? c.riskLevel) ? <RiskBadge level={c.risk_level ?? c.riskLevel} /> : <span className="text-slate-300 font-bold">—</span>}
                      </td>
                      {/* <td className="px-8 py-5">
                        {c.anomaly_flag
                          ? <span className="text-amber-600 font-black text-[10px] tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">⚠ ANOMALY</span>
                          : <span className="text-slate-300 font-medium">—</span>}
                      </td> */}
                      <td className="px-8 py-5">
                        <button
                          onClick={() => setSelected(c)}
                          className="inline-flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-2">
            <p className="text-[11px] font-bold text-secondary">
              Viewing audit trail {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center bg-white border border-border text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                ←
              </button>
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
              >
                →
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── Explanation Modal ── */}
      {selected && <ExplanationCard container={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}