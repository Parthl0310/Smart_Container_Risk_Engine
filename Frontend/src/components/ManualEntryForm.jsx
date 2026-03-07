import { useState } from "react";
import api from "../services/api";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ManualEntryForm Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a structured form for manual shipment data entry.
 * Designed to be used within a modal on the Dashboard.
 * 
 * Fields match the core logistics manifest structure required by the ML engine.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ManualEntryForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    container_id: "",
    declaration_date: "",
    declaration_time: "",
    trade_regime: "Import",
    origin_country: "",
    destination_country: "",
    destination_port: "",
    hs_code: "",
    importer_id: "",
    exporter_id: "",
    declared_value: "",
    declared_weight: "",
    measured_weight: "",
    shipping_line: "",
    dwell_time_hours: "",
    clearance_status: "Pending",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      /**
       * ── API CALL TO BACKEND ──
       * Sending single row for ML analysis.
       * Expects return of a scored container object.
       */
      await api.post("/v1/container/create", {
        Container_ID: formData.container_id,
        "Declaration_Date (YYYY-MM-DD)": formData.declaration_date,
        Declaration_Time: formData.declaration_time,
        "Trade_Regime (Import / Export / Transit)": formData.trade_regime,
        Origin_Country: formData.origin_country,
        Destination_Country: formData.destination_country,
        Destination_Port: formData.destination_port,
        HS_Code: formData.hs_code,
        Importer_ID: formData.importer_id,
        Exporter_ID: formData.exporter_id,
        Declared_Value: parseFloat(formData.declared_value) || 0,
        Declared_Weight: parseFloat(formData.declared_weight) || 0,
        Measured_Weight: parseFloat(formData.measured_weight) || 0,
        Shipping_Line: formData.shipping_line,
        Dwell_Time_Hours: parseInt(formData.dwell_time_hours) || 0,
      });

      onSuccess();
    } catch (err) {
      console.error("Manual entry error:", err);
      setError(err.response?.data?.message || "Failed to analyze shipment. Ensure backend endpoint /analyze/single is active.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-medium text-slate-900";
  const selectClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-900 appearance-none";
  const labelClass = "text-[10px] font-black tracking-widest uppercase text-secondary mb-1.5 block ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-lg">⚠️</span>
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Container ID */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Container ID / Shipment Number *</label>
          <input
            name="container_id"
            value={formData.container_id}
            onChange={handleChange}
            placeholder="e.g. MSKU1234567"
            className={inputClass}
            required
          />
        </div>

        {/* Declaration Date */}
        <div>
          <label className={labelClass}>Declaration Date</label>
          <input
            type="date"
            name="declaration_date"
            value={formData.declaration_date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Declaration Time */}
        <div>
          <label className={labelClass}>Declaration Time</label>
          <input
            type="time"
            name="declaration_time"
            value={formData.declaration_time}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Trade Regime */}
        <div>
          <label className={labelClass}>Trade Regime</label>
          <select
            name="trade_regime"
            value={formData.trade_regime}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="Import">Import</option>
            <option value="Export">Export</option>
            <option value="Transit">Transit</option>
          </select>
        </div>

        {/* Origin */}
        <div>
          <label className={labelClass}>Origin Country</label>
          <input
            name="origin_country"
            value={formData.origin_country}
            onChange={handleChange}
            placeholder="e.g. China"
            className={inputClass}
          />
        </div>

        {/* Destination Port */}
        <div>
          <label className={labelClass}>Destination Port</label>
          <input
            name="destination_port"
            value={formData.destination_port}
            onChange={handleChange}
            placeholder="e.g. Port of Jebel Ali"
            className={inputClass}
          />
        </div>

        {/* Destination Country */}
        <div>
          <label className={labelClass}>Destination Country</label>
          <input
            name="destination_country"
            value={formData.destination_country}
            onChange={handleChange}
            placeholder="e.g. UAE"
            className={inputClass}
          />
        </div>

        {/* HS Code */}
        <div>
          <label className={labelClass}>HS Code</label>
          <input
            name="hs_code"
            value={formData.hs_code}
            onChange={handleChange}
            placeholder="e.g. 8471.30"
            className={inputClass}
          />
        </div>

        {/* Importer ID */}
        <div>
          <label className={labelClass}>Importer ID</label>
          <input
            name="importer_id"
            value={formData.importer_id}
            onChange={handleChange}
            placeholder="EXP-12345"
            className={inputClass}
          />
        </div>

        {/* Exporter ID */}
        <div>
          <label className={labelClass}>Exporter ID</label>
          <input
            name="exporter_id"
            value={formData.exporter_id}
            onChange={handleChange}
            placeholder="IMP-67890"
            className={inputClass}
          />
        </div>

        {/* Declared Value */}
        <div>
          <label className={labelClass}>Declared Value (USD)</label>
          <input
            type="number"
            name="declared_value"
            value={formData.declared_value}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        {/* Declared Weight */}
        <div>
          <label className={labelClass}>Declared Weight (KG)</label>
          <input
            type="number"
            name="declared_weight"
            value={formData.declared_weight}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        {/* Measured Weight */}
        <div>
          <label className={labelClass}>Measured Weight (KG)</label>
          <input
            type="number"
            name="measured_weight"
            value={formData.measured_weight}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        {/* Shipping Line */}
        <div>
          <label className={labelClass}>Shipping Line</label>
          <input
            name="shipping_line"
            value={formData.shipping_line}
            onChange={handleChange}
            placeholder="e.g. Maersk"
            className={inputClass}
          />
        </div>

        {/* Dwell Time Hours */}
        <div>
          <label className={labelClass}>Dwell Time (Hours)</label>
          <input
            type="number"
            name="dwell_time_hours"
            value={formData.dwell_time_hours}
            onChange={handleChange}
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 text-xs font-black tracking-widest uppercase text-secondary hover:text-navy hover:bg-slate-50 rounded-2xl transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] py-4 bg-orange-400 hover:bg-orange-600 text-white text-xs font-black tracking-widest uppercase rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
        >
          {loading ? "Analyzing..." : "Analyze Shipment →"}
        </button>
      </div>
    </form>
  );
}