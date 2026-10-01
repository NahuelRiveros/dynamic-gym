import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useConsultaMedia } from "../../../hook/use_consulta_media.js";
import DataGridPaginacion from "./data_grid_paginacion.jsx";
import DataGridTabla from "./data_grid_tabla.jsx";
import DataGridTarjetas from "./data_grid_tarjetas.jsx";
import { procesarFilas, siguienteOrden } from "./procesar_filas.js";

// En celular (menos de 768 px) una tarjeta por fila: una tabla ancha obliga a desplazarse de costado.
const EN_CELULAR = "(max-width: 767px)";

/**
 * Tabla de datos con búsqueda, orden, paginación y acciones por fila. En celular, tarjetas.
 *
 *   <DataGrid rows={items} keyField="id" columns={[
 *     { key: "nombre", label: "Nombre", sortable: true, principal: true },   // principal: título de la tarjeta
 *     { key: "estado", label: "Estado", render: (fila, valor) => <Badge>{valor}</Badge> },
 *   ]} />
 *
 * Columnas: key ("persona.nombre" para anidados), label, sortable, searchable (false = no busca ahí),
 *   align ("left" | "center" | "right"), render(fila, valor), className / headerClassName (solo tabla).
 * Acciones: [{ key, label, icon, variant: "primary" | "danger" | "success" | "warning", onClick(fila),
 *   show(fila), disabled(fila) }].
 * Paginación en el servidor: pasar onPageChange (activa el modo externo) con page, totalPages,
 *   totalRows, pageSize, onPageSizeChange y onSearch (la búsqueda la hace el servidor).
 */
export default function DataGrid({
  rows = [],
  columns = [],
  keyField = "id",
  loading = false,
  emptyMessage = "No hay registros disponibles.",
  searchable = true,
  searchPlaceholder = "Buscar…",
  title,
  subtitle,
  actions = [],
  actionsLabel = "Acciones",
  pageSize: tamanioInicial = 20,
  pageSizeOptions = [10, 20, 30, 50],
  page: paginaExterna,
  totalPages: totalPaginasExterno,
  totalRows: totalFilasExterno,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRowClick,
  className = "",
}) {
  const enCelular = useConsultaMedia(EN_CELULAR);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState(null);
  const [paginaInterna, setPaginaInterna] = useState(1);
  const [tamanioInterno, setTamanioInterno] = useState(tamanioInicial);

  // Modo externo: el servidor ya filtra, ordena y pagina; acá solo se muestra.
  const externo = typeof onPageChange === "function";
  const tamanio = externo ? tamanioInicial : tamanioInterno;

  const procesadas = useMemo(
    () => (externo ? rows : procesarFilas({ filas: rows, columnas: columns, busqueda, orden })),
    [externo, rows, columns, busqueda, orden],
  );

  const total = externo ? (totalFilasExterno ?? rows.length) : procesadas.length;
  const totalPaginas = externo ? Math.max(1, Number(totalPaginasExterno) || 1) : Math.max(1, Math.ceil(procesadas.length / tamanio));
  const pagina = Math.min(Math.max(1, externo ? Number(paginaExterna) || 1 : paginaInterna), totalPaginas);

  const filasPagina = externo ? rows : procesadas.slice((pagina - 1) * tamanio, pagina * tamanio);
  const desde = total === 0 ? 0 : (pagina - 1) * tamanio + 1;
  const hasta = total === 0 ? 0 : (pagina - 1) * tamanio + filasPagina.length;

  function irAPagina(n) {
    const destino = Math.min(Math.max(1, n), totalPaginas);
    if (externo) onPageChange(destino);
    else setPaginaInterna(destino);
  }

  function cambiarTamanio(n) {
    setTamanioInterno(n);
    onPageSizeChange?.(n);
    irAPagina(1);
  }

  function buscar(texto) {
    setBusqueda(texto);
    if (externo) onSearch?.(texto);
    else setPaginaInterna(1);
  }

  const etiqueta = title ?? "Listado";
  const Vista = enCelular ? DataGridTarjetas : DataGridTabla;

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || subtitle || searchable) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {(title || subtitle) && (
            <div>
              {title && <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
          )}
          {searchable && (
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 sm:w-64">
              <Search size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => buscar(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
          )}
        </div>
      )}

      <Vista
        etiqueta={etiqueta}
        columnas={columns}
        filas={filasPagina}
        keyField={keyField}
        cargando={loading}
        filasSkeleton={Math.min(tamanio, 8)}
        emptyMessage={emptyMessage}
        actions={actions}
        actionsLabel={actionsLabel}
        orden={orden}
        onOrdenar={(key) => setOrden((actual) => siguienteOrden(actual, key))}
        onRowClick={onRowClick}
      />

      {!loading && total > 0 && (
        <DataGridPaginacion
          pagina={pagina}
          totalPaginas={totalPaginas}
          desde={desde}
          hasta={hasta}
          total={total}
          tamanio={tamanio}
          opcionesTamanio={pageSizeOptions}
          onPagina={irAPagina}
          onTamanio={cambiarTamanio}
        />
      )}
    </div>
  );
}
