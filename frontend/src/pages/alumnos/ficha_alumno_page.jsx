import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../auth/auth_context.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useDetalleAlumno } from "../../hook/use_alumnos.js";
import { nombreMetodo, plata } from "../../lib/dinero.js";
import DatosAlumno from "./datos_alumno.jsx";
import TarjetaPlanActual from "./tarjeta_plan_actual.jsx";

const fecha = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) : "—");

const columnasHistorial = (idActual) => [
  {
    key: "tipoplan_desc",
    label: "Plan",
    principal: true,
    sortable: true,
    render: (fila, valor) => (
      <span className="font-semibold text-slate-900">
        {valor || "—"}
        {fila.plan_id === idActual && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">Actual</span>}
      </span>
    ),
  },
  { key: "inicio", label: "Desde", sortable: true, render: (_f, v) => fecha(v) },
  { key: "fin", label: "Hasta", sortable: true, render: (_f, v) => fecha(v) },
  { key: "metodo_pago", label: "Método", render: (_f, v) => nombreMetodo(v) },
  { key: "monto_pagado", label: "Monto", align: "right", sortable: true, searchable: false, render: (_f, v) => <span className="font-semibold tabular-nums">{plata(v)}</span> },
];

/** Ficha del alumno: sus datos, el plan actual con su situación, y el historial de pagos. */
export default function FichaAlumnoPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const consulta = useDetalleAlumno(id);
  const data = consulta.data;

  const dni = data?.alumno?.gym_persona_documento;
  const rutaCobrar = `/admin/pagos/registrar?dni=${dni ?? ""}`;
  const rutaCorregir = `/admin/alumnos/editar-plan?dni=${dni ?? ""}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <Link to="/admin/estadisticas/alumnos" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Alumnos
      </Link>

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      {consulta.isPending ? (
        <div aria-label="Cargando la ficha" className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        consulta.isSuccess && (
          <>
            <DatosAlumno alumno={data.alumno} esAdmin={usuario?.roles?.includes("admin")} rutaCobrar={rutaCobrar} rutaCorregir={rutaCorregir} />

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-5">
                <TarjetaPlanActual plan={data.plan_actual} rutaCobrar={rutaCobrar} />
                <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div>
                    <dt className="text-xs text-slate-500">Total pagado</dt>
                    <dd className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">{plata(data.resumen?.total_recaudado)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Planes pagados</dt>
                    <dd className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">{data.resumen?.total_pagos ?? 0}</dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-2">
                <DataGrid
                  title="Historial de pagos"
                  rows={data.planes}
                  columns={columnasHistorial(data.plan_actual?.plan_id)}
                  keyField="plan_id"
                  searchable={false}
                  emptyMessage="Todavía no tiene pagos registrados."
                  pageSize={10}
                  pageSizeOptions={[10, 20]}
                />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
