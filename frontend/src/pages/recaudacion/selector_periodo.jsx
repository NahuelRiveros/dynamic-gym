import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const BOTON =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-40";

/**
 * Encabezado de cada pantalla de recaudación: volver al nivel de arriba, el período y las flechas
 * para pasar al anterior / siguiente (no hay "siguiente" en el futuro).
 */
export default function SelectorPeriodo({ titulo, volver = null, onAnterior, onSiguiente, sinSiguiente = false, etiqueta = "período" }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {volver && (
          <Link to={volver.ruta} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {volver.texto}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 first-letter:uppercase sm:text-3xl">{titulo}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onAnterior} aria-label={`${etiqueta} anterior`} className={BOTON}>
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </button>
        <button type="button" onClick={onSiguiente} disabled={sinSiguiente} aria-label={`${etiqueta} siguiente`} className={BOTON}>
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
