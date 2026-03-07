/* ─────────────────────────────────────────────────────────────────────────────
   ExplanationCard.jsx
   ─────────────────────────────────────────────────────────────────────────────
   Full-detail modal for a single container showing:
     • All shipment fields from CSV
     • Risk score bar + risk level badge
     • anomaly   — String from ML (e.g. "Weight mismatch of 340kg detected")
     • action    — String from ML (e.g. "Immediate physical inspection required")
     • explanation_summary — SHAP-generated 1–2 line natural language summary

   No direct API call — receives full container object as prop.
   Parent components (Results.jsx / Dashboard.jsx) pass the selected container.

   Props:
     container  Object   — full container document from MongoDB
     onClose    Function — called when modal is dismissed

   MongoDB container shape expected:
     container_id, declaration_date, declaration_time, trade_regime,
     origin_country, destination_country, destination_port, hs_code,
     importer_id, exporter_id, shipping_line, clearance_status,
     declared_value, declared_weight, measured_weight, dwell_time_hours,
     risk_score, risk_level, explanation_summary,
     anomaly (String), action (String),
     processed, uploadedAt
   ───────────────────────────────────────────────────────────────────────────── */

import RiskBadge from "./RiskBadge";

// ── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  if (score == null) return <span className="text-slate-400 text-xs font-mono">—</span>;
  const pct    = Math.min(100, Math.max(0, score));
  const isHigh = pct >= 60;
  const color  = isHigh ? "#EF4444" : "#10B981"; // Alert Red and Success Green
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-border/50">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-bold font-mono w-8 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

// ── Info Cell ─────────────────────────────────────────────────────────────────
function InfoCell({ label, value, mono = false }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
      <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 mb-1">{label}</p>
      <p className={`text-xs font-semibold text-slate-800 truncate ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExplanationCard({ container, onClose }) {
  if (!container) return null;

  const dw = container.declared_weight ?? container.Declared_Weight;
  const mw = container.measured_weight ?? container.Measured_Weight;
  const weightDiff = dw != null && mw != null ? Math.abs(dw - mw).toFixed(1) : null;

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal card — stop propagation so clicking inside doesn't close */}
      <div
        className="bg-card border border-border/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1">
              Container Detail
            </p>
            <h2 className="text-base font-bold text-slate-900 font-mono">
              {container.container_id ?? container.Container_ID ?? "—"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Risk level — driven by ML output stored in MongoDB */}
              <RiskBadge level={container.risk_level ?? container.riskLevel} />

              {/* Anomaly badge — only shown when anomaly string is populated */}
              {container.anomaly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-100 tracking-wider">
                  ⚠ ANOMALY
                </span>
              )}

              {/* Processed flag — whether ML has scored this container */}
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-xl tracking-wider border shadow-md ${
                container.processed
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}>
                {(container.processed ?? container.riskScore ?? container.risk_score) != null ? "SCORED" : "PENDING SCORE"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all rounded-xl w-9 h-9 flex items-center justify-center text-lg ml-4 flex-shrink-0"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">

          {/* ── Risk Score Bar ── */}
          <div className="bg-card border border-border/50 rounded-xl p-6 animate-in fade-in duration-1000 shadow-md">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
              Risk Score  <span className="text-slate-300 font-normal">(0 = safe · 100 = critical)</span>
            </p>
            <ScoreBar score={container.risk_score ?? container.riskScore} />
          </div>

          {/* ── Shipment Fields Grid ──────────────────────────────────────────
              All fields come from the CSV parsed by backend uploadController.js
              and stored in the containers MongoDB collection.
              API: GET /api/results  or  GET /api/admin/results
          ─────────────────────────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3">
              Shipment Details
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <InfoCell label="Trade Regime"     value={container.trade_regime ?? container["Trade_Regime (Import / Export / Transit)"]} />
              <InfoCell label="Origin Country"   value={container.origin_country ?? container.Origin_Country} />
              <InfoCell label="Destination"      value={container.destination_country ?? container.Destination_Country} />
              <InfoCell label="Dest. Port"       value={container.destination_port ?? container.Destination_Port} />
              <InfoCell label="HS Code"          value={container.hs_code ?? container.HS_Code}       mono />
              <InfoCell label="Shipping Line"    value={container.shipping_line ?? container.Shipping_Line} />
              <InfoCell label="Importer ID"      value={container.importer_id ?? container.Importer_ID}   mono />
              <InfoCell label="Exporter ID"      value={container.exporter_id ?? container.Exporter_ID}   mono />
              {/* <InfoCell label="Clearance Status" value={container.clearance_status} /> */}
              <InfoCell
                label="Declared Value"
                value={(container.declared_value ?? container.Declared_Value) != null
                  ? `$${Number(container.declared_value ?? container.Declared_Value).toLocaleString()}`
                  : null}
              />
              <InfoCell
                label="Declared Weight"
                value={(container.declared_weight ?? container.Declared_Weight) != null ? `${container.declared_weight ?? container.Declared_Weight} kg` : null}
              />
              <InfoCell
                label="Measured Weight"
                value={(container.measured_weight ?? container.Measured_Weight) != null ? `${container.measured_weight ?? container.Measured_Weight} kg` : null}
              />
            </div>

            {/* Weight discrepancy callout */}
            {weightDiff !== null && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                Number(weightDiff) > 50
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-slate-50 border-slate-100 text-slate-600"
              }`}>
                <span>⚖</span>
                Weight discrepancy:
                <span className="font-bold font-mono ml-1">{weightDiff} kg</span>
                {Number(weightDiff) > 50 && (
                  <span className="ml-auto text-[10px] font-bold text-red-600 tracking-wider">HIGH VARIANCE</span>
                )}
              </div>
            )}

            {/* Dwell time callout */}
            {(container.dwell_time_hours ?? container.Dwell_Time_Hours) != null && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
                (container.dwell_time_hours ?? container.Dwell_Time_Hours) > 72
                  ? "bg-amber-50 border-amber-100 text-amber-700"
                  : "bg-slate-50 border-slate-100 text-slate-600"
              }`}>
                <span>⏱</span>
                Dwell time:
                <span className="font-bold font-mono ml-1">{container.dwell_time_hours ?? container.Dwell_Time_Hours}h</span>
                {(container.dwell_time_hours ?? container.Dwell_Time_Hours) > 72 && (
                  <span className="ml-auto text-[10px] font-bold text-amber-700 tracking-wider">ABOVE THRESHOLD</span>
                )}
              </div>
            )}
          </div>

          {/* ── Anomaly ──────────────────────────────────────────────────────
              Populated by Python ML service (anomaly_detection.py)
              Stored as String in containers.anomaly
              e.g. "Weight discrepancy of 340kg detected above threshold"
                   "Declared value-to-weight ratio 18x above average"
              null = no anomaly found
          ─────────────────────────────────────────────────────────────────── */}
          {container.anomaly && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-500 mb-2 flex items-center gap-2">
                <span>⚠</span> Anomaly Detected
              </p>
              <p className="text-sm font-semibold text-amber-800 leading-relaxed">
                {container.anomaly}
              </p>
            </div>
          )}

          {/* ── Recommended Action ───────────────────────────────────────────
              Populated by Python ML service (explain.py)
              Stored as String in containers.action
              e.g. "Immediate physical inspection recommended"
                   "Flag for document verification"
                   "Clear for processing"
              null = not yet scored
          ─────────────────────────────────────────────────────────────────── */}
          {container.action && (
            <div className={`border rounded-xl p-4 ${
              container.risk_level === "Critical"
                ? "bg-red-50 border-red-100"
                : "bg-emerald-50 border-emerald-100"
            }`}>
              <p className={`text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2 ${
                (container.risk_level ?? container.riskLevel) === "Critical" || (container.risk_level ?? container.riskLevel) === "High" ? "text-red-400" : "text-emerald-500"
              }`}>
                <span>→</span> Recommended Action
              </p>
              <p className={`text-sm font-semibold leading-relaxed ${
                (container.risk_level ?? container.riskLevel) === "Critical" || (container.risk_level ?? container.riskLevel) === "High" ? "text-red-800" : "text-emerald-800"
              }`}>
                {container.action}
              </p>
            </div>
          )}

          {/* ── SHAP Explanation ─────────────────────────────────────────────
              Populated by Python ML service (explain.py using SHAP values)
              Stored as String in containers.explanation_summary
              e.g. "High risk driven by weight discrepancy (42%) and
                    unusual HS code combination (31%) for this trade route."
              null = not yet scored
          ─────────────────────────────────────────────────────────────────── */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-2">
              <span>🤖</span> AI Explanation  <span className="font-normal text-slate-300">(SHAP)</span>
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {(container.explanation_summary ?? container.explanationSummary)
                || "No explanation generated yet. Run the ML prediction to generate SHAP-based insights for this container."}
            </p>
          </div>

          {/* ── Declaration Date / Time ── */}
          <div className="grid grid-cols-2 gap-2">
            <InfoCell label="Declaration Date" value={container.declaration_date ?? container["Declaration_Date (YYYY-MM-DD)"]} mono />
            <InfoCell label="Declaration Time" value={container.declaration_time ?? container.Declaration_Time} mono />
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <p className="text-[10px] text-slate-400 font-mono">
            Uploaded:{" "}
            {(container.uploadedAt ?? container.createdAt)
              ? new Date(container.uploadedAt ?? container.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium", timeStyle: "short",
                })
              : "—"}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold tracking-widest uppercase bg-navy hover:bg-slate-800 text-white rounded-xl transition-all shadow-md active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}