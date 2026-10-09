import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";

/**
 * Un ítem de la barra lateral. Achicada solo muestra el ícono: el nombre queda para lectores de
 * pantalla y como tooltip del navegador.
 */
export default function ItemMenu({ item, activa = false, soloIcono = false }) {
  const Icono = item.icono;
  return (
    <Link
      to={item.ruta}
      aria-current={activa ? "page" : undefined}
      title={soloIcono ? item.titulo : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition outline-none",
        "focus-visible:ring-2 focus-visible:ring-sky-400",
        soloIcono && "justify-center px-0",
        activa ? "bg-sky-500/15 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
      )}
    >
      {activa && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-400" />}
      {Icono && <Icono aria-hidden="true" className={cn("h-5 w-5 shrink-0", activa && "text-sky-400")} />}
      <span className={cn("truncate", soloIcono && "sr-only")}>{item.titulo}</span>
    </Link>
  );
}
