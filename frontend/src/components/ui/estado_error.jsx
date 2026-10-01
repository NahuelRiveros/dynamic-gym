import { RefreshCw } from "lucide-react";
import { mensajeDeError } from "../../hook/consultas_utils.js";

/** Error al cargar datos, con botón para reintentar. Recibe el `error` de useQuery o un `mensaje`. */
export default function EstadoError({ error, mensaje, onReintentar, reintentando = false }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{mensaje ?? mensajeDeError(error)}</span>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          disabled={reintentando}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-1.5 font-semibold text-red-700 transition outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
        >
          <RefreshCw size={13} className={reintentando ? "animate-spin" : ""} aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
