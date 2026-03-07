import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import Navbar from "../components/Navbar";

// ── Role Badge (Light Theme) ──────────────────────────────────────────────────
function RoleBadge({ role }) {
  return role === "admin"
    ? <span className="px-2.5 py-0.5 text-[9px] font-black rounded-lg bg-navy/5 text-navy border border-navy/10 tracking-widest uppercase shadow-sm">Super Admin</span>
    : <span className="px-2.5 py-0.5 text-[9px] font-black rounded-lg bg-primary/5 text-primary border border-primary/10 tracking-widest uppercase shadow-sm">Risk Analyst</span>;
}

// ── Stat Card (Light Theme) ───────────────────────────────────────────────────
function StatCard({ label, value, accent, icon }) {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-secondary">{label}</span>
        <span className="text-xl filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
      </div>
      <p className={`text-3xl font-black tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

// ── User Detail Drawer ────────────────────────────────────────────────────────
function UserDrawer({ user, onClose }) {
  const [userContainers, setUserContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/admin/results?userId=${user._id}`);
        setUserContainers(data.containers || []);
      } catch {
        setUserContainers([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user._id]);

  const critical = userContainers.filter(c => c.risk_level === "Critical").length;
  const lowRisk  = userContainers.filter(c => c.risk_level === "Low Risk").length;

  return (
    <div className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-md flex justify-end animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-card border-l border-border/50 w-full max-w-md h-full overflow-y-auto p-8 flex flex-col gap-8 shadow-2xl animate-in slide-in-from-right-full duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-secondary font-black mb-1">Intelligence Profile</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">User Dossier</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-secondary hover:bg-slate-100 hover:text-slate-900 transition-all text-xl font-bold">✕</button>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-center gap-5 bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            {user.profilePhoto?.url
              ? <img src={user.profilePhoto.url} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-3xl">👤</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-slate-900 truncate tracking-tight">{user.name}</p>
            <p className="text-xs font-medium text-secondary truncate mt-0.5 tracking-wide">{user.email}</p>
            <div className="mt-3"><RoleBadge role={user.role} /></div>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-secondary mb-2">Activation Date</p>
            <p className="text-sm text-slate-700 font-bold">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Total Assets",    userContainers.length, "text-primary"],
              ["Critical Risk", critical,              "text-red-500"],
              ["Low Severity",  lowRisk,               "text-emerald-500"],
            ].map(([l, v, c]) => (
              <div key={l} className="bg-white border border-border rounded-2xl p-4 text-center shadow-sm">
                <p className={`text-xl font-black ${c}`}>{loading ? "…" : v}</p>
                <p className="text-[8px] font-black text-secondary tracking-widest uppercase mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent stream */}
        <div className="flex-1 min-h-0 flex flex-col">
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-secondary mb-4">Latest Audit Stream</p>
          {loading ? (
            <div className="flex items-center justify-center py-10 animate-pulse">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : userContainers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <span className="text-2xl mb-2">🛰️</span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Active Telemetry</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {userContainers.slice(0, 10).map((c, i) => (
                <div key={c._id || i} className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3 hover:border-primary/20 hover:bg-slate-50/50 transition-all shadow-sm group">
                  <span className="text-xs font-mono font-bold text-primary group-hover:scale-105 transition-transform">{c.container_id || "—"}</span>
                  {c.risk_level
                    ? <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg border ${
                        c.risk_level === "Critical" 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}>
                        {c.risk_level.toUpperCase()}
                      </span>
                    : <span className="text-[9px] font-black text-slate-300 tracking-widest px-2 py-0.5 rounded-lg border border-slate-100 bg-slate-50">QUEUED</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users,       setUsers]       = useState([]);
  const [allContainers, setAllContainers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab,   setActiveTab]   = useState("users");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [usersRes, containersRes] = await Promise.all([
          api.get("/admin/users"),
          api.get("/admin/results"),
        ]);
        setUsers(usersRes.data.users || []);
        setAllContainers(containersRes.data.containers || []);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalCritical = allContainers.filter(c => c.risk_level === "Critical").length;
  const totalLowRisk  = allContainers.filter(c => c.risk_level === "Low Risk").length;
  const totalPending  = allContainers.filter(c => !c.processed).length;

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const containersByUser = {};
  allContainers.forEach(c => {
    const uid = c.userId?.toString() || "unknown";
    containersByUser[uid] = (containersByUser[uid] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-background font-sans text-text">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-primary uppercase mb-3">
              <span className="w-6 h-px bg-primary"></span>
              Administrative Command Center
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Platform <span className="text-secondary font-medium">Governance</span>
            </h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-border/50 hover:bg-slate-50 text-slate-700 text-xs font-black tracking-widest uppercase rounded-xl transition-all shadow-sm active:scale-95 animate-in fade-in slide-in-from-right-4 duration-700"
          >
            ← Return to Intel Lab
          </button>
        </div>

        {/* ── Global Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <StatCard label="Global Workforce" value={users.length} accent="text-slate-900" icon="👥" />
          <StatCard label="Platform Assets" value={allContainers.length} accent="text-primary" icon="📦" />
          <StatCard label="Critical Breaches" value={totalCritical} accent="text-red-500" icon="🚨" />
          <StatCard label="Audit Queue" value={totalPending} accent="text-indigo-500" icon="⏳" />
        </div>

        {/* ── Tabs ── */}
        <div className="flex p-1.5 mb-10 bg-slate-100 border border-slate-200 rounded-2xl w-full sm:w-fit animate-in fade-in duration-700 delay-100 overflow-x-auto">
          {[
            { id: "users", label: `User Directory`, count: users.length },
            { id: "containers", label: `Global Inventory`, count: allContainers.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none px-8 py-3 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm ring-1 ring-slate-200/50"
                  : "text-secondary hover:text-slate-900"
              }`}
            >
              {tab.label} <span className="ml-2 font-medium opacity-50">[{tab.count}]</span>
            </button>
          ))}
        </div>

        {/* ══ USERS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Search + Filter */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
              <div className="relative flex-1 max-w-md">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search by operative name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none rounded-2xl pl-10 pr-4 py-3.5 text-xs text-slate-700 placeholder-slate-400 transition-all font-medium shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "analyst", "admin"].map(r => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`px-5 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all border shadow-sm ${
                      filterRole === r
                        ? "bg-primary text-white border-primary shadow-primary/20 scale-105"
                        : "bg-white border-border text-secondary hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border/50 rounded-xl shadow-md overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-secondary uppercase">Syncing Directory...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-300 gap-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl">👥</div>
                  <p className="text-[10px] font-black tracking-widest uppercase">No operatives found in records</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-border">
                        {["Operative", "Secure Email", "Authorization", "Asset Load", "Deployment", "Access"].map((h, i) => (
                          <th key={i} className="px-8 py-5 text-secondary font-black tracking-widest text-[9px] uppercase">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u, i) => (
                        <tr
                          key={u._id || i}
                          className="group hover:bg-slate-50/80 transition-all duration-200"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                {u.profilePhoto?.url
                                  ? <img src={u.profilePhoto.url} alt={u.name} className="w-full h-full object-cover" />
                                  : <span className="text-lg">👤</span>
                                }
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm tracking-tight">{u.name}</p>
                                {u._id === currentUser?.id && (
                                  <p className="text-[8px] font-black text-primary tracking-[0.1em] uppercase mt-0.5 mt-1 bg-primary/5 px-1.5 py-0.5 rounded inline-block">Active Identity</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-mono text-xs font-medium text-slate-500">{u.email}</td>
                          <td className="px-8 py-5"><RoleBadge role={u.role} /></td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                              <span className="text-primary font-black text-sm">
                                {containersByUser[u._id?.toString()] || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-slate-400 font-bold text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="inline-flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ ALL CONTAINERS TAB ═════════════════════════════════════════════ */}
        {activeTab === "containers" && (
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                <p className="text-[10px] font-black tracking-[0.2em] text-secondary uppercase">Scanning Global Inventory...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-border">
                      {["Asset ID", "Origin Port", "HS Code", "Risk Metric", "Dossier Level", "Anomaly", "Assignee"].map(h => (
                        <th key={h} className="px-8 py-5 text-secondary font-black tracking-widest text-[9px] uppercase whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allContainers.slice(0, 50).map((c, i) => {
                      const owner = users.find(u => u._id?.toString() === c.userId?.toString());
                      return (
                        <tr key={c._id || i} className="group hover:bg-slate-50/80 transition-all duration-200">
                          <td className="px-8 py-5 font-mono font-bold text-primary text-xs">{c.container_id || "—"}</td>
                          <td className="px-8 py-5 text-xs font-bold text-slate-700">{c.origin_country || "—"}</td>
                          <td className="px-8 py-5 font-mono text-xs font-semibold text-slate-400">{c.hs_code || "—"}</td>
                          <td className="px-8 py-5">
                            {c.risk_score != null
                              ? <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${c.risk_score >= 60 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                  <span className={`font-black text-xs ${c.risk_score >= 60 ? "text-red-500" : "text-emerald-600"}`}>
                                    {c.risk_score}%
                                  </span>
                                </div>
                              : <span className="text-slate-300 font-bold">—</span>
                            }
                          </td>
                          <td className="px-8 py-5">
                            {c.risk_level
                              ? <span className={`inline-flex px-2.5 py-1 text-[9px] font-black rounded-lg tracking-widest uppercase border ${
                                  c.risk_level === "Critical"
                                    ? "bg-red-50 text-red-600 border-red-100 shadow-sm"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm"
                                }`}>
                                  {c.risk_level.toUpperCase()}
                                </span>
                              : <span className="text-slate-300 font-bold">—</span>
                            }
                          </td>
                          <td className="px-8 py-5">
                            {c.anomaly_flag
                              ? <span className="text-amber-600 font-black text-[10px] tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100">⚠ YES</span>
                              : <span className="text-slate-200 font-medium">—</span>
                            }
                          </td>
                          <td className="px-8 py-5">
                            {owner
                              ? <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    {owner.profilePhoto?.url
                                      ? <img src={owner.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                                      : <span className="text-[10px]">👤</span>
                                    }
                                  </div>
                                  <span className="text-slate-600 font-bold text-[11px] truncate max-w-[120px]">{owner.name}</span>
                                </div>
                              : <span className="text-slate-300 font-medium">—</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {allContainers.length > 50 && (
                  <div className="px-8 py-4 bg-slate-50/50 border-t border-border text-[10px] font-bold text-secondary tracking-widest uppercase">
                    Snapshot of 50 Assets · Utilize Global Intelligence Lab for full telemetry
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── User Drawer ── */}
      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}