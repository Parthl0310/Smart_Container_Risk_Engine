import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/* ─────────────────────────────────────────────────────────────────────────────
   AvatarUpload — two modes:
     compact={false}  Full card for a Profile Settings page
     compact={true}   Small inline row for a dropdown / sidebar

   Props:
     compact   Boolean — render small inline version
     onUpdate  Callback fired with updatedUser after upload or delete

   API calls:
     PUT    /api/profile/photo   — upload new photo to Cloudinary
     DELETE /api/profile/photo   — destroy photo from Cloudinary + DB
───────────────────────────────────────────────────────────────────────────── */

const MAX_MB   = 2;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUpload({ compact = false, onUpdate }) {
  const { user } = useAuth();
  const fileRef  = useRef(null);

  const [preview,  setPreview]  = useState(null);
  const [file,     setFile]     = useState(null);
  const [status,   setStatus]   = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  const currentPhoto = user?.profilePhoto?.url || null;
  const displayPhoto = preview || currentPhoto;

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // ── Pick file ─────────────────────────────────────────────────────────────
  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { setErrorMsg("Only JPG, PNG or WebP accepted."); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setErrorMsg(`Max ${MAX_MB}MB allowed.`); return; }
    setErrorMsg("");
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading"); setProgress(0);
    const form = new FormData();
    form.append("profilePhoto", file);
    try {
      const { data } = await api.put("/profile/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      const updated = { ...user, profilePhoto: data.profilePhoto };
      localStorage.setItem("user", JSON.stringify(updated));
      setStatus("success"); setFile(null); setPreview(null);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Upload failed.");
      setStatus("error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    setStatus("deleting");
    try {
      await api.delete("/profile/photo");
      const updated = { ...user, profilePhoto: { url: null, publicId: null } };
      localStorage.setItem("user", JSON.stringify(updated));
      setStatus("idle"); setPreview(null); setFile(null);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Delete failed.");
      setStatus("error");
    }
  };

  const discard = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setFile(null); setErrorMsg(""); setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const AvatarCircle = ({ size = "md" }) => {
    const cls = size === "sm" ? "w-14 h-14 rounded-xl text-lg" : "w-24 h-24 rounded-xl text-3xl";
    return (
      <div className={`${cls} overflow-hidden border-2 border-navy/20 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform hover:scale-105`}
        style={!displayPhoto ? { background: "linear-gradient(135deg, #2563EB, #0F172A)" } : {}}>
        {displayPhoto
          ? <img src={displayPhoto} alt="avatar" className="w-full h-full object-cover" />
          : <span className="font-bold text-white shadow-sm">{initials}</span>
        }
      </div>
    );
  };

  // ────────────────────────────────────────────────
  // COMPACT MODE
  // ────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          <AvatarCircle size="sm" />
          <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-xs">✏</span>
          </div>
          {preview && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-[#0c1525]" title="Unsaved preview" />
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-[#00d4ff]/8 border border-[#00d4ff]/20 text-[#00d4ff] rounded-lg hover:bg-[#00d4ff]/15 transition-colors">
              {displayPhoto ? "Change" : "Upload"}
            </button>
            {file && (
              <button onClick={handleUpload} disabled={status === "uploading"}
                className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                {status === "uploading" ? `${progress}%` : "Save"}
              </button>
            )}
            {(currentPhoto || preview) && (
              <button onClick={file ? discard : handleDelete} disabled={status === "deleting"}
                className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-red-500/8 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/15 transition-colors disabled:opacity-40">
                {file ? "Discard" : status === "deleting" ? "..." : "Remove"}
              </button>
            )}
          </div>
          {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  // FULL MODE
  // ────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-md overflow-hidden animate-in fade-in duration-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-slate-50/50">
        <p className="text-xs font-black tracking-widest uppercase text-secondary">Profile Identity</p>
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* Current avatar + info */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <AvatarCircle size="lg" />
            {preview && (
              <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-amber-500 rounded text-[9px] font-bold text-[#05090f] tracking-wider">
                PREVIEW
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-slate-900 tracking-tight">{user?.name}</p>
            <p className="text-xs font-medium text-secondary">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-1.5 h-1.5 rounded-full ${currentPhoto ? "bg-success" : "bg-slate-300"}`} />
              <span className="text-[10px] text-secondary font-bold tracking-wider">
                {currentPhoto ? "Cloudinary Biometrics Synchronized" : "Generic Avatar · Initialization Required"}
              </span>
            </div>
          </div>
        </div>

        <div onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border/50 hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50/50 group">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
          <p className="text-xs font-black text-slate-700 group-hover:text-primary transition-colors tracking-tight">
            {preview ? "Replace Selected Asset" : "Deploy Personal Signature Photo"}
          </p>
          <p className="text-[10px] text-secondary font-medium mt-1.5">
            JPG · PNG · WebP &nbsp;·&nbsp; Max {MAX_MB}MB &nbsp;·&nbsp; Enterprise Encryption Active
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            <span className="text-red-400">⚠</span>
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-black tracking-wider uppercase">
              <span className="text-secondary">Synchronizing Assets...</span>
              <span className="text-primary font-mono">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-border/50">
              <div className="h-full bg-primary rounded-full transition-all duration-200 shadow-sm" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
            <span className="text-emerald-400">✓</span>
            <p className="text-xs text-emerald-400 font-semibold">Photo updated successfully</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {file && (
            <>
              <button onClick={handleUpload} disabled={status === "uploading"}
                className="flex-1 py-3.5 bg-primary hover:bg-blue-700 text-white text-[10px] font-black tracking-[0.2em] uppercase rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
                {status === "uploading" ? "Synchronizing..." : "Initialize Signature →"}
              </button>
              <button onClick={discard}
                className="px-5 py-3 text-xs font-bold tracking-widest uppercase border border-[#1a2e4a] text-[#4a6a8a] hover:text-[#c8daf0] hover:border-[#1e3f6a] rounded-xl transition-colors">
                Discard
              </button>
            </>
          )}
          {currentPhoto && !file && (
            <button onClick={handleDelete} disabled={status === "deleting"}
              className="px-5 py-3 text-xs font-bold tracking-widest uppercase border border-red-500/20 text-red-400 hover:bg-red-500/5 rounded-xl transition-colors disabled:opacity-40">
              {status === "deleting" ? "Removing..." : "Remove Photo"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
