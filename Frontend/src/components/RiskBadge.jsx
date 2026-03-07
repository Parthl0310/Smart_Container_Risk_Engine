/* ─────────────────────────────────────────────────────────────────────────────
   RiskBadge.jsx
   ─────────────────────────────────────────────────────────────────────────────
   Reusable chip for displaying container risk level.

   Supported Levels:
     - Low Risk
     - Medium Risk
     - High Risk

   Used in:
     ContainerTable.jsx
     ExplanationCard.jsx
     Dashboard.jsx
     Results.jsx
     AdminPanel.jsx
   ───────────────────────────────────────────────────────────────────────────── */

   function normalizeLevel(l) {
    if (!l) return l;
    const s = String(l);
    if (s === "High" || s === "Critical" || s === "High Risk") return "High Risk";
    if (s === "Medium" || s === "Medium Risk") return "Medium Risk";
    if (s === "Low" || s === "Low Risk") return "Low Risk";
    return l;
  }

   export default function RiskBadge({ level }) {
    const normalized = normalizeLevel(level);

    /* ── High Risk ───────────────────────────────────────── */
  
    if (normalized === "High Risk") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-red-50 text-red-600 border border-red-200 tracking-wider whitespace-nowrap shadow-sm">
  
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
  
          HIGH RISK
  
        </span>
      );
    }
  
    /* ── Medium Risk ─────────────────────────────────────── */
  
    if (normalized === "Medium Risk") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-yellow-50 text-yellow-600 border border-yellow-200 tracking-wider whitespace-nowrap shadow-sm">
  
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
  
          MEDIUM RISK
  
        </span>
      );
    }
  
    /* ── Low Risk ───────────────────────────────────────── */
  
    if (normalized === "Low Risk") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-xl bg-green-50 text-green-600 border border-green-200 tracking-wider whitespace-nowrap shadow-sm">
  
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  
          LOW RISK
  
        </span>
      );
    }
  
    /* ── Fallback (if unexpected value) ───────────────────── */
  
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-xl bg-gray-100 text-gray-500 border border-gray-200">
        {level || "—"}
      </span>
    );
  }