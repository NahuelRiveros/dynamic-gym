import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

function BotonPagina({ onClick, disabled, etiqueta, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiqueta}
      title={etiqueta}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Pie del DataGrid: "1–20 de 57", filas por página y botones de página. */
export default function DataGridPaginacion({ pagina, totalPaginas, desde, hasta, total, tamanio, opcionesTamanio, onPagina, onTamanio }) {
  return (
    <nav aria-label="Paginación" className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">
          <b className="text-slate-700">{desde}</b>–<b className="text-slate-700">{hasta}</b> de <b className="text-slate-700">{total}</b>
        </span>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          Filas
          <select
            value={tamanio}
            onChange={(e) => onTamanio(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            {opcionesTamanio.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <BotonPagina onClick={() => onPagina(1)} disabled={pagina <= 1} etiqueta="Primera página"><ChevronsLeft size={12} /></BotonPagina>
        <BotonPagina onClick={() => onPagina(pagina - 1)} disabled={pagina <= 1} etiqueta="Página anterior"><ChevronLeft size={12} /></BotonPagina>
        <span className="min-w-[3rem] text-center text-xs font-semibold text-slate-700" aria-live="polite">
          {pagina} / {totalPaginas}
        </span>
        <BotonPagina onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas} etiqueta="Página siguiente"><ChevronRight size={12} /></BotonPagina>
        <BotonPagina onClick={() => onPagina(totalPaginas)} disabled={pagina >= totalPaginas} etiqueta="Última página"><ChevronsRight size={12} /></BotonPagina>
      </div>
    </nav>
  );
}
