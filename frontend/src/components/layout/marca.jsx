import { Link } from "react-router-dom";
import { images } from "../../assets/index.js";
import { cn } from "../../lib/cn.js";

/** Logo + nombre. `oscuro`: sobre la barra lateral. `soloLogo`: barra lateral achicada. */
export default function Marca({ oscuro = false, soloLogo = false, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Dynamic Gym, ir al inicio"
      className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <img src={images.dynamicLogo} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm" />
      {!soloLogo && (
        <span className={cn("truncate text-lg font-bold tracking-tight", oscuro ? "text-white" : "text-slate-900")}>
          Dynamic <span className={oscuro ? "text-sky-400" : "text-sky-600"}>Gym</span>
        </span>
      )}
    </Link>
  );
}
