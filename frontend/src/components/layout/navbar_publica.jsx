import { NavLink } from "react-router-dom";
import { LogIn } from "lucide-react";
import { cn } from "../../lib/cn.js";
import Marca from "./marca.jsx";

const claseLink = ({ isActive }) =>
  cn(
    "rounded-xl px-3 py-2 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
    isActive ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

/** Barra de la parte pública (sin sesión): pocas opciones, entran en el celular sin menú escondido. */
export default function NavbarPublica() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Marca />
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={(estado) => cn(claseLink(estado), "hidden sm:block")}>
            Inicio
          </NavLink>
          <NavLink to="/consulta-plan" className={claseLink}>
            Mi Plan
          </NavLink>
          <NavLink
            to="/login"
            className="ml-1 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            <span>Ingresar</span>
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
