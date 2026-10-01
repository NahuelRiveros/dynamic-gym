import { Inbox } from "lucide-react";
import AccionFila from "./accion_fila.jsx";
import { propsFilaClickeable } from "./fila_clickeable.js";
import { valorDe } from "./procesar_filas.js";

const contenido = (col, fila) => {
  const valor = valorDe(fila, col.key);
  return col.render ? col.render(fila, valor) : valor || <span className="text-slate-300">—</span>;
};

/**
 * Vista de celular del DataGrid: una tarjeta por fila. La columna `principal` (o la primera) va
 * arriba sin rótulo; el resto, con su rótulo en dos columnas; las acciones al pie, con texto.
 */
export default function DataGridTarjetas({ etiqueta, columnas, filas, keyField, cargando, filasSkeleton, emptyMessage, actions, onRowClick }) {
  if (cargando) {
    return (
      <ul aria-label={etiqueta} aria-busy="true" className="space-y-3 p-3">
        {Array.from({ length: filasSkeleton }, (_, i) => (
          <li key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </ul>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <Inbox size={24} className="text-slate-300" aria-hidden="true" />
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  const principal = columnas.find((c) => c.principal) ?? columnas[0];
  const resto = columnas.filter((c) => c !== principal);

  return (
    <ul aria-label={etiqueta} className="space-y-3 p-3">
      {filas.map((fila, i) => (
        <li
          key={String(fila[keyField] ?? i)}
          {...propsFilaClickeable(onRowClick, fila)}
          className={`rounded-xl border border-slate-200 bg-white p-4 ${onRowClick ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-400" : ""}`}
        >
          {principal && <div className="font-semibold text-slate-800">{contenido(principal, fila)}</div>}
          {resto.length > 0 && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {resto.map((col) => (
                <div key={col.key} className="min-w-0">
                  <dt className="text-xs text-slate-500">{col.label}</dt>
                  <dd className="break-words text-slate-800">{contenido(col, fila)}</dd>
                </div>
              ))}
            </dl>
          )}
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-slate-100 pt-2">
              {actions.map((a) => <AccionFila key={a.key ?? a.label} accion={a} fila={fila} />)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
