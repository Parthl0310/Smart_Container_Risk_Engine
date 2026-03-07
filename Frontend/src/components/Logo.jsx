import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-3 group select-none">
      
      {/* Hexagon */}
      <div
        className="w-10 h-10 flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-105"
        style={{
          background: "#f97316",
          clipPath:
            "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
        }}
      >
        ⬡
      </div>

      {/* Text */}
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900 uppercase">
          SmartContainer
        </p>

        <p className="text-[9px] tracking-[0.25em] text-slate-900 uppercase">
          Risk Intelligence
        </p>
      </div>

    </Link>
  );
}