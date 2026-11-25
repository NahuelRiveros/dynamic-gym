import { NavLink } from "react-router-dom";
import { cn } from "../../../lib/cn.js";
import MarcaPublica from "./marca_publica.jsx";

const BASE = "dg-display inline-flex min-h-11 items-center text-lg font-bold whitespace-nowrap transition outline-none focus-visible:ring-3 focus-visible:ring-cobalto sm:text-xl";
const claseLink = ({ isActive }) => cn(BASE, "hover:text-cobalto", isActive && "text-cobalto");

/** Barra de la parte pública (sin sesión): pocas opciones, entran en el celular sin menú escondido. */
export default function NavbarPublica() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#cfd5db] bg-pared text-goma">
      <nav aria-label="Principal" className="flex h-[calc(4rem-1px)] items-center justify-between gap-3 px-4 lg:px-[4.4vw]">
        <MarcaPublica />
        <div className="flex items-center gap-3 sm:gap-7">
          <NavLink to="/" end className={(estado) => cn(claseLink(estado), "max-[379px]:hidden")}>
            Inicio
          </NavLink>
          <NavLink to="/consulta-plan" className={claseLink}>
            Mi Plan
          </NavLink>
          <NavLink to="/login" className={cn(BASE, "bg-goma px-3 text-white hover:bg-cobalto sm:px-5")}>
            Ingresar
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
