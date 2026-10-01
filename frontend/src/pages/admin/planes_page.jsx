import { useState } from "react";
import PlanFormModal from "../../components/modal/plan_form_modal";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import ConfirmDialog from "../../components/ui/confirm_dialog.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { usePlanesPopulares } from "../../hook/use_estadisticas.js";
import { useCambiarEstadoPlan, useGuardarPlan, usePlanes } from "../../hook/use_planes.js";
import { Layers, Plus, Edit2, ToggleLeft, ToggleRight, RefreshCw, BarChart2 } from "lucide-react";

const ANIO_ACTUAL = new Date().getFullYear();

function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0,
  }).format(Number(precio || 0));
}

function iniciales(desc) {
  return String(desc || "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("") || "P";
}

export default function PlanesPage() {
  const consultaPlanes = usePlanes();
  const planes = consultaPlanes.data ?? [];
  const cargando = consultaPlanes.isFetching;
  const cargarPlanes = () => consultaPlanes.refetch();

  const [anioStats, setAnioStats] = useState(ANIO_ACTUAL);
  const consultaPopularidad = usePlanesPopulares(anioStats);
  const popularidad = consultaPopularidad.data?.items ?? [];
  const cargandoStats = consultaPopularidad.isPending;

  const [modalAbierto, setModalAbierto]         = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [planAConfirmar, setPlanAConfirmar]     = useState(null);
  const guardar = useGuardarPlan();
  const cambiarEstado = useCambiarEstadoPlan();

  function abrirNuevo()       { guardar.reset(); setPlanSeleccionado(null); setModalAbierto(true); }
  function abrirEditar(plan)  { guardar.reset(); setPlanSeleccionado(plan); setModalAbierto(true); }
  function cerrarModal()      { setModalAbierto(false); setPlanSeleccionado(null); }

  async function guardarPlan(datos) {
    // Si falla, el modal queda abierto y muestra el error (ej. "Ya existe un plan con esa descripción").
    await guardar.mutateAsync({ id: planSeleccionado?.id, datos }).then(cerrarModal, () => {});
  }

  function toggleEstado(plan) {
    cambiarEstado.reset();
    setPlanAConfirmar(plan);
  }

  async function confirmarCambioEstado() {
    const plan = planAConfirmar;
    await cambiarEstado.mutateAsync({ id: plan.id, activo: !plan.activo }).then(() => setPlanAConfirmar(null), () => {});
  }

  const activos   = planes.filter((p) => p.activo).length;
  const inactivos = planes.length - activos;

  const columns = [
    {
      key: "descripcion",
      label: "Plan",
      sortable: true,
      searchable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-extrabold text-white shadow-sm shadow-blue-500/30">
            {iniciales(row.descripcion)}
          </div>
          <span className="font-semibold text-slate-900">{row.descripcion}</span>
        </div>
      ),
    },
    {
      key: "dias_totales",
      label: "Días",
      sortable: true,
      className: "text-slate-600 text-center",
      headerClassName: "text-center",
      align: "center",
    },
    {
      key: "ingresos",
      label: "Ingresos",
      sortable: true,
      className: "text-slate-600 text-center",
      headerClassName: "text-center",
      align: "center",
      render: (_, val) => val ?? "—",
    },
    {
      key: "precio",
      label: "Precio",
      sortable: true,
      render: (_, val) => (
        <span className="font-bold text-blue-700">{formatearPrecio(val)}</span>
      ),
    },
    {
      key: "activo",
      label: "Estado",
      render: (_, val) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {val ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "actualizado_en",
      label: "Último cambio",
      className: "text-slate-500 text-xs hidden lg:table-cell",
      headerClassName: "hidden lg:table-cell",
      render: (_, val) => formatearFecha(val),
    },
  ];

  const actions = [
    {
      key: "editar",
      label: "Editar",
      icon: <Edit2 size={12} />,
      variant: "primary",
      onClick: (row) => abrirEditar(row),
    },
    {
      key: "desactivar",
      label: "Desactivar",
      icon: <ToggleLeft size={12} />,
      variant: "danger",
      onClick: (row) => toggleEstado(row),
      show: (row) => row.activo,
    },
    {
      key: "activar",
      label: "Activar",
      icon: <ToggleRight size={12} />,
      variant: "success",
      onClick: (row) => toggleEstado(row),
      show: (row) => !row.activo,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Layers size={11} />
                Admin
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Catálogo de planes</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Administrá descripción, duración, ingresos, precio y estado de cada plan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={cargarPlanes} disabled={cargando} aria-label="Actualizar planes" title="Actualizar planes"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} aria-hidden="true" />
              </button>
              <button
                type="button" onClick={abrirNuevo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
              >
                <Plus size={14} /> Nuevo plan
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total planes"   value={String(planes.length)} highlight />
          <StatCard label="Activos"   value={String(activos)}   green />
          <StatCard label="Inactivos" value={String(inactivos)} />
        </div>

        {/* ── POPULARIDAD ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Rendimiento de planes</span>
            </div>
            <div className="flex items-center gap-1">
              {[ANIO_ACTUAL - 1, ANIO_ACTUAL].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAnioStats(a)}
                  className={[
                    "rounded-lg px-3 py-1 text-xs font-bold transition",
                    anioStats === a
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "border border-slate-200 text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            {cargandoStats ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">Cargando…</div>
            ) : consultaPopularidad.isError ? (
              <EstadoError error={consultaPopularidad.error} onReintentar={() => consultaPopularidad.refetch()} />
            ) : popularidad.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-400">Sin datos para {anioStats}</div>
            ) : (
              <GraficoPopularidad items={popularidad} />
            )}
          </div>
        </div>

        {/* ── ERROR ── */}
        {consultaPlanes.isError && <EstadoError error={consultaPlanes.error} onReintentar={cargarPlanes} reintentando={cargando} />}

        {/* ── TABLA ── */}
        <DataGrid
          rows={planes}
          columns={columns}
          keyField="id"
          loading={consultaPlanes.isPending}
          searchable
          searchPlaceholder="Buscar plan…"
          emptyMessage="No hay planes cargados."
          actions={actions}
          actionsLabel="Acciones"
          pageSize={15}
          pageSizeOptions={[10, 15, 25]}
        />

      </div>

      <PlanFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardarPlan}
        planEditar={planSeleccionado}
        cargando={guardar.isPending}
        errorServidor={guardar.isError ? mensajeDeError(guardar.error, "No se pudo guardar el plan") : null}
      />

      <ConfirmDialog
        open={Boolean(planAConfirmar)}
        title={planAConfirmar?.activo ? "¿Desactivar plan?" : "¿Activar plan?"}
        message={
          cambiarEstado.isError
            ? mensajeDeError(cambiarEstado.error, "No se pudo cambiar el estado del plan")
            : `"${planAConfirmar?.descripcion ?? ""}" ${planAConfirmar?.activo ? "deja de ofrecerse al registrar pagos." : "vuelve a ofrecerse al registrar pagos."}`
        }
        confirmLabel={planAConfirmar?.activo ? "Desactivar" : "Activar"}
        variant={planAConfirmar?.activo ? "danger" : "primary"}
        loading={cambiarEstado.isPending}
        onConfirm={confirmarCambioEstado}
        onClose={() => setPlanAConfirmar(null)}
      />
    </div>
  );
}

const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

function GraficoPopularidad({ items }) {
  const totalVentas    = items.reduce((acc, i) => acc + i.total_ventas, 0);
  const totalRecaudado = items.reduce((acc, i) => acc + i.total_recaudado, 0);
  const maxVentas      = Math.max(...items.map((i) => i.total_ventas));

  const estrella    = items[0];
  const mayorRecaud = [...items].sort((a, b) => b.total_recaudado - a.total_recaudado)[0];
  const mejorTicket = [...items]
    .filter((i) => i.total_ventas > 0)
    .sort((a, b) => b.total_recaudado / b.total_ventas - a.total_recaudado / a.total_ventas)[0];

  const COLORES = [
    "bg-blue-600", "bg-blue-500", "bg-blue-400",
    "bg-sky-500",  "bg-sky-400",
    "bg-cyan-500", "bg-cyan-400",
    "bg-indigo-500",
  ];

  return (
    <div className="space-y-5">

      {/* ── RESUMEN EJECUTIVO ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResumenCard
          icono="🏆"
          titulo="Más vendido"
          valor={estrella?.plan ?? "—"}
          detalle={estrella ? `${estrella.total_ventas} suscripciones` : ""}
          color="blue"
        />
        <ResumenCard
          icono="💰"
          titulo="Mayor recaudación"
          valor={mayorRecaud ? fmtARS(mayorRecaud.total_recaudado) : "—"}
          detalle={mayorRecaud?.plan ?? ""}
          color="emerald"
        />
        <ResumenCard
          icono="🎯"
          titulo="Mejor ticket promedio"
          valor={mejorTicket && mejorTicket.total_ventas > 0
            ? fmtARS(Math.round(mejorTicket.total_recaudado / mejorTicket.total_ventas))
            : "—"}
          detalle={mejorTicket ? `${mejorTicket.plan} · por suscripción` : ""}
          color="violet"
        />
      </div>

      {/* ── TABLA DE PLANES ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2 text-left w-6">#</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-left hidden sm:table-cell">Popularidad</th>
              <th className="px-3 py-2 text-right">Suscripc.</th>
              <th className="px-3 py-2 text-right hidden md:table-cell">Part. %</th>
              <th className="px-3 py-2 text-right">Recaudado</th>
              <th className="px-3 py-2 text-right hidden lg:table-cell">Ticket prom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, idx) => {
              const pctVentas    = totalVentas > 0    ? Math.round((item.total_ventas    / totalVentas)    * 100) : 0;
              const anchoPct     = maxVentas > 0      ? (item.total_ventas / maxVentas) * 100 : 0;
              const ticket       = item.total_ventas > 0 ? Math.round(item.total_recaudado / item.total_ventas) : 0;
              const color        = COLORES[idx % COLORES.length];
              const esTop        = idx === 0;

              return (
                <tr key={item.plan} className={`transition hover:bg-slate-50 ${esTop ? "bg-blue-50/40" : ""}`}>
                  <td className="px-3 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {esTop && <span className="text-sm">🏆</span>}
                      <span className={`font-semibold ${esTop ? "text-blue-700" : "text-slate-700"}`}>
                        {item.plan}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="relative h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${color}`}
                          style={{ width: `${anchoPct}%`, minWidth: anchoPct > 0 ? "4px" : "0" }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-extrabold text-slate-800">
                    {item.total_ventas}
                  </td>
                  <td className="px-3 py-2.5 text-right hidden md:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      pctVentas >= 30 ? "bg-blue-100 text-blue-700"
                      : pctVentas >= 15 ? "bg-sky-100 text-sky-700"
                      : "bg-slate-100 text-slate-500"
                    }`}>
                      {pctVentas}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                    {totalRecaudado > 0 ? fmtARS(item.total_recaudado) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right hidden lg:table-cell text-slate-500">
                    {ticket > 0 ? fmtARS(ticket) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
              <td colSpan={3} className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-400 hidden sm:table-cell">
                Totales
              </td>
              <td colSpan={3} className="px-3 py-2 text-[11px] uppercase tracking-wider text-slate-400 sm:hidden">
                Totales
              </td>
              <td className="px-3 py-2 text-right text-slate-800">{totalVentas}</td>
              <td className="px-3 py-2 text-right hidden md:table-cell text-slate-400">100%</td>
              <td className="px-3 py-2 text-right text-emerald-700">
                {totalRecaudado > 0 ? fmtARS(totalRecaudado) : "—"}
              </td>
              <td className="px-3 py-2 text-right hidden lg:table-cell text-slate-500">
                {totalVentas > 0 && totalRecaudado > 0 ? fmtARS(Math.round(totalRecaudado / totalVentas)) : "—"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── INSIGHT ── */}
      {totalRecaudado === 0 && (
        <p className="text-center text-[11px] text-slate-400">
          Los precios de los planes están en $0 — actualizalos para ver recaudación real.
        </p>
      )}
    </div>
  );
}

function ResumenCard({ icono, titulo, valor, detalle, color }) {
  const estilos = {
    blue:   "border-blue-100   bg-blue-50   text-blue-700",
    emerald:"border-emerald-100 bg-emerald-50 text-emerald-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 ${estilos[color]}`}>
      <div className="text-lg leading-none">{icono}</div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">{titulo}</div>
      <div className="mt-1 text-sm font-extrabold leading-tight truncate" title={valor}>{valor}</div>
      {detalle && <div className="mt-0.5 text-[10px] opacity-60 truncate">{detalle}</div>}
    </div>
  );
}

function StatCard({ label, value, highlight, green }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20"
        : green  ? "border-emerald-200 bg-emerald-50"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : green ? "text-emerald-600" : "text-slate-500"}`}>
        {label}
      </div>
      <p className={`mt-1.5 text-2xl font-extrabold leading-tight ${highlight ? "text-white" : green ? "text-emerald-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
