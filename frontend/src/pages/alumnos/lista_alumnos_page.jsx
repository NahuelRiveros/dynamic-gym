import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, RefreshCw, UserPlus } from "lucide-react";
import { useAuth } from "../../auth/auth_context.jsx";
import SituacionBadge from "../../components/alumnos/situacion_badge.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useActualizarEstados, useListadoAlumnos } from "../../hook/use_alumnos.js";
import { useValorDemorado } from "../../hook/use_valor_demorado.js";
import { cn } from "../../lib/cn.js";
import { ingresosParaMostrar, situacionDelPlan } from "../../lib/situacion_plan.js";

const FILTROS = [
  { valor: "", texto: "Todos" },
  { valor: "true", texto: "Con plan vigente" },
  { valor: "false", texto: "Sin plan vigente" },
];
const ORDENES = {
  apellido: { texto: "Apellido (A-Z)", sort: "apellido", order: "asc" },
  vence: { texto: "Vencen antes", sort: "vencimiento", order: "asc" },
};

// La lista trae el último plan del alumno; con esto se calcula la misma situación que en la ficha.
const planDeFila = (fila) =>
  fila.plan_id
    ? { vigente_hoy: fila.tiene_plan_vigente, ingresos_disponibles: fila.ingresos_disponibles, ingresos_ilimitados: fila.ingresos_ilimitados, dias_restantes: fila.dias_restantes }
    : null;
const iniciales = (fila) => `${fila.gym_persona_apellido?.[0] ?? ""}${fila.gym_persona_nombre?.[0] ?? ""}`.toUpperCase() || "?";
const fecha = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) : "—");

const COLUMNAS = [
  {
    key: "gym_persona_apellido",
    label: "Alumno",
    principal: true,
    render: (fila) => (
      <span className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {iniciales(fila)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-slate-900">
            {fila.gym_persona_apellido} {fila.gym_persona_nombre}
          </span>
          <span className="block text-xs text-slate-500">DNI {fila.gym_persona_documento}</span>
        </span>
      </span>
    ),
  },
  { key: "situacion", label: "Situación", render: (fila) => <SituacionBadge situacion={situacionDelPlan(planDeFila(fila))} /> },
  {
    key: "plan_tipo_desc",
    label: "Plan",
    render: (fila) =>
      fila.plan_id ? (
        <span>
          <span className="block text-slate-800">{fila.plan_tipo_desc || "—"}</span>
          <span className="block text-xs text-slate-500">Vence {fecha(fila.plan_fin)}</span>
        </span>
      ) : (
        "—"
      ),
  },
  { key: "ingresos_disponibles", label: "Ingresos", align: "center", render: (fila) => ingresosParaMostrar(planDeFila(fila)) },
];

/** Alumnos: buscar, filtrar y abrir la ficha. Desde cada fila se puede ir directo a cobrarle. */
export default function ListaAlumnosPage() {
  const nav = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.includes("admin");

  const [planVigente, setPlanVigente] = useState("");
  const [orden, setOrden] = useState("apellido");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // La búsqueda va al servidor cuando se deja de escribir (300 ms), no en cada tecla.
  const q = useValorDemorado(busqueda.trim());
  const { sort, order } = ORDENES[orden];
  const consulta = useListadoAlumnos({ page, limit, sort, order, ...(q ? { q } : {}), ...(planVigente ? { plan_vigente: planVigente } : {}) });
  const actualizarEstados = useActualizarEstados();

  const items = consulta.data?.items ?? [];
  const pag = consulta.data?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const cambiar = (setter) => (valor) => {
    setter(valor);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Alumnos</h1>
          <p className="mt-1 text-sm text-slate-500">{consulta.isPending ? "Cargando…" : `${pag.total} ${pag.total === 1 ? "alumno" : "alumnos"}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {esAdmin && (
            <button
              type="button"
              onClick={() => actualizarEstados.mutate()}
              disabled={actualizarEstados.isPending}
              title="Vuelve a calcular quién está habilitado según su plan (se hace solo cada hora)"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
            >
              <RefreshCw aria-hidden="true" className={cn("h-4 w-4", actualizarEstados.isPending && "animate-spin")} />
              Recalcular estados
            </button>
          )}
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            Nuevo alumno
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por plan" className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {FILTROS.map(({ valor, texto }) => (
            <button
              key={texto}
              type="button"
              aria-pressed={planVigente === valor}
              onClick={() => cambiar(setPlanVigente)(valor)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                planVigente === valor ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {texto}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Ordenar por
          <select
            value={orden}
            onChange={(e) => cambiar(setOrden)(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {Object.entries(ORDENES).map(([clave, { texto }]) => (
              <option key={clave} value={clave}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      </div>

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      <DataGrid
        rows={items}
        columns={COLUMNAS}
        keyField="gym_alumno_id"
        loading={consulta.isPending}
        searchPlaceholder="Buscar por nombre, apellido, DNI o email…"
        onSearch={cambiar(setBusqueda)}
        emptyMessage={q ? `No hay alumnos que coincidan con "${q}".` : "No hay alumnos para mostrar."}
        onRowClick={(fila) => nav(`/admin/estadisticas/alumnos/${fila.gym_alumno_id}`)}
        actions={[
          {
            key: "cobrar",
            label: "Cobrar",
            icon: <CreditCard className="h-3.5 w-3.5" />,
            variant: "primary",
            onClick: (fila) => nav(`/admin/pagos/registrar?dni=${fila.gym_persona_documento}`),
          },
        ]}
        page={pag.page}
        totalPages={pag.totalPages}
        totalRows={pag.total}
        onPageChange={setPage}
        onPageSizeChange={cambiar(setLimit)}
        pageSize={limit}
      />
    </div>
  );
}
