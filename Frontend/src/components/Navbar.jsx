import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

// ── Nav link helper ───────────────────────────────────────────────────────────
function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all duration-200 ${
          isActive
            ? "bg-orange-400/10 text-orange-400 border border-orange-400/20 shadow-sm"
            : "text-secondary hover:text-slate-900 hover:bg-slate-50 border border-transparent"
        }`
      }
    >
      <span className="text-sm opacity-80">{icon}</span>
      {label}
    </NavLink>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ user, size = "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  if (user?.profilePhoto?.url) {
    return (
      <img
        src={user.profilePhoto.url}
        alt={user.name}
        className={`${dim} rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-sm`}
      />
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center font-black text-white flex-shrink-0 bg-orange-400 shadow-lg`}
    >
      {initials}
    </div>
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return role === "admin"
    ? (
      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 uppercase">
        Admin Access
      </span>
    )
    : (
      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-lg bg-orange-50 text-orange-600 border border-orange-200 uppercase">
        Risk Analyst
      </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {

  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropOpen,setDropOpen] = useState(false);
  const [mobileOpen,setMobileOpen] = useState(false);

  const dropRef = useRef(null);

  useEffect(()=>{
    const handler = (e)=>{
      if(dropRef.current && !dropRef.current.contains(e.target)){
        setDropOpen(false)
      }
    }

    document.addEventListener("mousedown",handler)
    return ()=>document.removeEventListener("mousedown",handler)
  },[])

  useEffect(()=>{
    setMobileOpen(false)
  },[location.pathname])

  const handleLogout = async ()=>{
    setDropOpen(false)
    await logout()
    navigate("/login",{replace:true})
  }

  const navLinks = [
    {to:"/dashboard",label:"Dashboard",icon:"⬡"},
    {to:"/results",label:"Results",icon:"📊"},
    ...(isAdmin ? [{to:"/admin",label:"Admin Panel",icon:"🛡"}] : [])
  ]

  return (

    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">

        <div className="max-w-7xl mx-auto px-6">

          <div className="flex items-center justify-between h-16">

            {/* BRAND LOGO */}
            <Logo to="/"/>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center gap-2">

              {navLinks.map(link => (
                <NavItem key={link.to} {...link}/>
              ))}

            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">

              {/* USER DROPDOWN */}
              <div className="relative" ref={dropRef}>

                <button
                  onClick={()=>setDropOpen(!dropOpen)}
                  className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl border border-gray-200 hover:border-gray-300 bg-slate-50 hover:bg-white transition-all shadow-sm"
                >

                  <Avatar user={user} size="sm"/>

                  <div className="hidden sm:flex flex-col items-start leading-none pr-1">
                    <span className="text-xs font-bold text-slate-900 max-w-[100px] truncate">
                      {user?.name?.split(" ")[0] || "User"}
                    </span>
                  </div>

                  <span className={`text-gray-400 text-[10px] transition-transform ${dropOpen ? "rotate-180":""}`}>
                    ▾
                  </span>

                </button>

                {/* DROPDOWN */}
                {dropOpen && (

                  <div className="absolute right-0 top-full mt-3 w-72 bg-white border rounded-3xl shadow-2xl overflow-hidden z-50">

                    <div className="px-5 py-6 border-b bg-gray-50 flex items-center gap-4">

                      <Avatar user={user} size="md"/>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-black text-slate-900 truncate">
                          {user?.name}
                        </p>

                        <p className="text-[10px] text-gray-500 truncate">
                          {user?.email}
                        </p>

                        <div className="mt-2">
                          <RoleBadge role={user?.role}/>
                        </div>

                      </div>

                    </div>

                    <div className="p-2">

                      <DropItem
                        icon="⬡"
                        label="My Dashboard"
                        onClick={()=>{navigate("/dashboard");setDropOpen(false)}}
                        active={location.pathname === "/dashboard"}
                      />

                      <DropItem
                        icon="📊"
                        label="Historical Results"
                        onClick={()=>{navigate("/results");setDropOpen(false)}}
                        active={location.pathname === "/results"}
                      />

                      {isAdmin && (
                        <DropItem
                          icon="🛡"
                          label="Admin Control Panel"
                          onClick={()=>{navigate("/admin");setDropOpen(false)}}
                          active={location.pathname === "/admin"}
                        />
                      )}

                    </div>

                    <div className="border-t p-2">

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs text-red-500 hover:bg-red-50 rounded-2xl font-bold uppercase"
                      >
                        → Sign Out Session
                      </button>

                    </div>

                  </div>

                )}

              </div>

            </div>

          </div>

        </div>

      </nav>

    </>
  );
}


// ── Dropdown Menu Item ────────────────────────────────────────────────────────
function DropItem({ icon,label,onClick,active }) {

  return (

    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 text-xs rounded-2xl transition-all ${
        active
          ? "bg-orange-500 text-white font-bold"
          : "text-slate-600 font-bold hover:bg-slate-50"
      }`}
    >

      <span className="text-sm w-5 text-center">
        {icon}
      </span>

      <span className="tracking-widest uppercase truncate">
        {label}
      </span>

    </button>

  )

}