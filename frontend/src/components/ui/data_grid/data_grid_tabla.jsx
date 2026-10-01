import { ChevronDown, ChevronUp, ChevronsUpDown, Inbox } from "lucide-react";
import AccionFila from "./accion_fila.jsx";
import { propsFilaClickeable } from "./fila_clickeable.js";
import { valorDe } from "./procesar_filas.js";

const ANCHOS_SKELETON = ["72%", "48%", "60%", "42%", "55%", "36%", "44%", "30%"];
const alineacion = (align) => (align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left");

function Encabezado({ col, orden, onOrdenar }) {
  const activo = orden?.key === col.key;
  const ariaSort = activo ? (orden.dir === "asc" ? "ascending" : "descending") : undefined;
  const Icono = activo ? (orden.dir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${activo ? "text-blue-600" : "text-slate-500"} ${alineacion(col.align)} ${col.headerClassName ?? ""}`}
    >
      {col.sortable ? (
        // Un botón real: se puede ordenar con el teclado y el lector de pantalla lo anuncia.
        <button type="button" onClick={() => onOrdenar(col.key)} className="group inline-flex items-center gap-1 uppercase outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded">
          {col.label}
          <Icono size={11} aria-hidden="true" className={activo ? "text-blue-500" : "text-slate-300 group-hover:text-slate-500"} />
        </button>
      ) : (
        col.label
      )}
    </th>
  );
}

/** Vista de tabla (pantallas anchas) del DataGrid. */
export default function DataGridTabla({ etiqueta, columnas, filas, keyField, cargando, filasSkeleton, emptyMessage, actions, actionsLabel, orden, onOrdenar, onRowClick }) {
  const hayAcciones = actions.length > 0;
  const totalColumnas = columnas.length + (hayAcciones ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm" aria-label={etiqueta} aria-busy={cargando || undefined}>
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {columnas.map((col) => <Encabezado key={col.key} col={col} orden={orden} onOrdenar={onOrdenar} />)}
            {hayAcciones && (
              <th scope="col" className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">{actionsLabel}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            Array.from({ length: filasSkeleton }, (_, i) => (
              <tr key={i} className="border-t border-slate-100">
                {Array.from({ length: totalColumnas }, (_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: ANCHOS_SKELETON[j % ANCHOS_SKELETON.length] }} />
                  </td>
                ))}
              </tr>
            ))
          ) : filas.length === 0 ? (
            <tr>
              <td colSpan={totalColumnas} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Inbox size={24} className="text-slate-300" aria-hidden="true" />
                  <p className="text-sm text-slate-400">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            filas.map((fila, i) => (
              <tr
                key={String(fila[keyField] ?? i)}
                {...propsFilaClickeable(onRowClick, fila)}
                className={`border-t border-slate-100 transition ${onRowClick ? "cursor-pointer outline-none hover:bg-blue-50/40 focus-visible:bg-blue-50" : "hover:bg-slate-50/60"}`}
              >
                {columnas.map((col) => {
                  const valor = valorDe(fila, col.key);
                  return (
                    <td key={col.key} className={`px-4 py-3 text-sm ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""} ${col.className ?? ""}`}>
                      {col.render ? col.render(fila, valor) : valor || <span className="text-slate-300">—</span>}
                    </td>
                  );
                })}
                {hayAcciones && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {actions.map((a) => <AccionFila key={a.key ?? a.label} accion={a} fila={fila} />)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
