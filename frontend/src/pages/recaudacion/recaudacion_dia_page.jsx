import { useNavigate, useParams } from "react-router-dom";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useRecaudacionDetalleDia } from "../../hook/use_recaudacion.js";
import DatoResumen from "./dato_resumen.jsx";
import DesgloseMetodos from "./desglose_metodos.jsx";
import { COLOR, MESES, hoyAR, nombreMetodo, plata } from "./formato.js";
import SelectorPeriodo from "./selector_periodo.jsx";

const metodo = (_fila, valor) => (
  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">{nombreMetodo(valor)}</span>
);
const monto = (_fila, valor) => <span className="font-bold text-slate-900 tabular-nums">{plata(valor)}</span>;

const COLUMNAS_PLANES = [
  {
    key: "alumno",
    label: "Alumno",
    principal: true,
    sortable: true,
    render: (fila) => (
      <span>
        <span className="block font-semibold text-slate-900">{fila.alumno || "—"}</span>
        {fila.alumno_documento && <span className="block text-xs text-slate-500">DNI {fila.alumno_documento}</span>}
      </span>
    ),
  },
  { key: "plan", label: "Plan", render: (_f, v) => v || "—" },
  { key: "metodo_pago", label: "Método", render: metodo },
  { key: "usuario_cobro", label: "Cobró", render: (_f, v) => v || "—" },
  { key: "monto", label: "Monto", align: "right", sortable: true, searchable: false, render: monto },
];

const COLUMNAS_VENTAS = [
  { key: "producto", label: "Producto", principal: true, sortable: true },
  { key: "cantidad", label: "Cantidad", align: "center", searchable: false },
  { key: "metodo_pago", label: "Método", render: metodo },
  { key: "usuario", label: "Vendió", render: (_f, v) => v || "—" },
  { key: "monto", label: "Monto", align: "right", sortable: true, searchable: false, render: monto },
];

/** Un día de caja: cuánto entró, por qué método (para el cierre) y cada cobro y venta. */
export default function RecaudacionDiaPage() {
  const params = useParams();
  const nav = useNavigate();
  const [anio, mes, dia] = [params.anio, params.mes, params.dia].map(Number);
  const hoy = hoyAR();

  // Sin fecha válida en la dirección no se consulta (enabled: false).
  const consulta = useRecaudacionDetalleDia(anio, mes, dia);
  const data = consulta.data;

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  const titulo = Number.isNaN(fecha.getTime())
    ? "Día"
    : fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const esHoyOFuturo = anio > hoy.anio || (anio === hoy.anio && (mes > hoy.mes || (mes === hoy.mes && dia >= hoy.dia)));

  const irDia = (delta) => {
    const otro = new Date(Date.UTC(anio, mes - 1, dia + delta));
    nav(`/estadisticas/recaudaciones/${otro.getUTCFullYear()}/${otro.getUTCMonth() + 1}/${otro.getUTCDate()}/detalle`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <SelectorPeriodo
        titulo={`${titulo} ${anio !== hoy.anio ? anio : ""}`.trim()}
        volver={{ ruta: `/estadisticas/recaudaciones/${anio}/${mes}`, texto: `${MESES[mes - 1] ?? "Mes"} ${anio}` }}
        etiqueta="Día"
        onAnterior={() => irDia(-1)}
        onSiguiente={() => irDia(1)}
        sinSiguiente={esHoyOFuturo}
      />

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      {consulta.isPending ? (
        <div aria-label="Cargando el detalle del día" className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        consulta.isSuccess && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div className="col-span-2 lg:col-span-1">
                <DatoResumen destacado etiqueta="Total del día" valor={plata(data.total_dia)} />
              </div>
              <DatoResumen
                etiqueta="Planes"
                color={COLOR.planes}
                valor={plata(data.total_planes)}
                detalle={`${data.cantidad_cobros} ${data.cantidad_cobros === 1 ? "cobro" : "cobros"}`}
              />
              <DatoResumen
                etiqueta="Productos"
                color={COLOR.productos}
                valor={plata(data.total_productos)}
                detalle={`${data.ventas.length} ${data.ventas.length === 1 ? "venta" : "ventas"}`}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:order-2">
                <DesgloseMetodos metodos={data.metodos} titulo="Cierre de caja por método" />
              </div>
              <div className="space-y-5 lg:order-1 lg:col-span-2">
                <DataGrid
                  title="Cobros de planes"
                  rows={data.items}
                  columns={COLUMNAS_PLANES}
                  keyField="gym_fecha_id"
                  searchPlaceholder="Buscar alumno, plan o quién cobró…"
                  emptyMessage="No hubo cobros de planes este día."
                  pageSize={10}
                />
                <DataGrid
                  title="Ventas de productos"
                  rows={data.ventas}
                  columns={COLUMNAS_VENTAS}
                  keyField="id"
                  searchable={false}
                  emptyMessage="No hubo ventas de productos este día."
                  pageSize={10}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
