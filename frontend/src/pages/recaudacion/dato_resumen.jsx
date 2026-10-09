import { cn } from "../../lib/cn.js";

/** Un número del resumen (total, planes, productos...). `destacado`: el principal de la pantalla. */
export default function DatoResumen({ etiqueta, valor, detalle = null, destacado = false, color = null }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3.5", destacado ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white")}>
      <p className={cn("flex items-center gap-1.5 text-xs font-medium", destacado ? "text-slate-300" : "text-slate-500")}>
        {color && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />}
        {etiqueta}
      </p>
      <p className={cn("mt-1 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl", destacado ? "text-white" : "text-slate-900")}>{valor}</p>
      {detalle && <p className={cn("mt-0.5 text-xs", destacado ? "text-slate-400" : "text-slate-500")}>{detalle}</p>}
    </div>
  );
}
