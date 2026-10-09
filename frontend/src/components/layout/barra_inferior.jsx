import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { estaActiva } from "../../auth/permisos.js";
import { cn } from "../../lib/cn.js";
import MenuMovil from "./menu_movil.jsx";

const claseBoton = (activa) =>
  cn(
    "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition outline-none focus-visible:bg-slate-100",
    activa ? "text-sky-700" : "text-slate-500",
  );

function Icono({ icono: Componente, activa }) {
  return (
    <span className={cn("flex h-7 w-14 items-center justify-center rounded-full transition", activa && "bg-sky-100")}>
      <Componente aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

/** En el celular: las tareas de todos los días a un toque, y "Más" abre el menú completo. */
export default function BarraInferior({ accesos = [], menu = [], actual = null }) {
  const [abierto, setAbierto] = useState(false);
  // "Más" queda marcado en cualquier pantalla del panel que no tenga acceso propio abajo.
  const masActivo = Boolean(actual?.roles) && !accesos.some((item) => estaActiva(item, actual));

  return (
    <>
      <nav
        aria-label="Accesos rápidos"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${accesos.length + 1}, minmax(0, 1fr))` }}>
          {accesos.map((item) => {
            const activa = estaActiva(item, actual);
            return (
              <li key={item.id}>
                <Link to={item.ruta} aria-current={activa ? "page" : undefined} className={claseBoton(activa)}>
                  <Icono icono={item.icono} activa={activa} />
                  {item.corto ?? item.titulo}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setAbierto(true)} aria-haspopup="dialog" className={claseBoton(masActivo)}>
              <Icono icono={LayoutGrid} activa={masActivo} />
              Más
            </button>
          </li>
        </ul>
      </nav>

      {abierto && <MenuMovil menu={menu} actual={actual} onCerrar={() => setAbierto(false)} />}
    </>
  );
}
