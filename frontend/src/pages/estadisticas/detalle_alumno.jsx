import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAlumnoDetalle } from "../../api/alumnos_api";
import { ArrowLeft, BadgeCheck, Ban, RefreshCw, CreditCard, TrendingUp, Zap, Clock } from "lucide-react";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function money(v) {
  return Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function fmtFecha(val) {
  if (!val) return "—";
  return formatearFechaAR(String(val).slice(0, 10)) || "—";
}

function iniciales(nombre, apellido) {
  return ((String(apellido || "")[0] || "") + (String(nombre || "")[0] || "")).toUpperCase() || "?";
}

const METODO_STYLES = {
  EFECTIVO:      { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Efectivo" },
  TRANSFERENCIA: { bg: "bg-blue-50 text-blue-700 border-blue-200",          label: "Transferencia" },
  TARJETA:       { bg: "bg-violet-50 text-violet-700 border-violet-200",    label: "Tarjeta" },
  DEBITO:        { bg: "bg-orange-50 text-orange-700 border-orange-200",    label: "Débito" },
};

function MetodoBadge({ metodo }) {
  const key   = String(metodo || "").toUpperCase();
  const style = METODO_STYLES[key] ?? { bg: "bg-slate-50 text-slate-600 border-slate-200", label: metodo || "—" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.bg}`}>
      {style.label}
    </span>
  );
}

/* ── columnas historial ───────────────────────────────────────────────────── */

function buildHistorialColumns(planActualId) {
  return [
    {
      key: "tipoplan_desc",
      label: "Plan",
      sortable: true,
      render: (row, val) => (
        <div className="flex items-center gap-1.5">
          {row.plan_id === planActualId && <Zap size={10} className="text-blue-500 shrink-0" />}
          <span className="font-semibold text-slate-900">{val || "—"}</span>
        </div>
      ),
    },
    {
      key: "inicio",
      label: "Inicio",
      sortable: true,
      className: "text-slate-600",
      render: (_, val) => fmtFecha(val),
    },
    {
      key: "fin",
      label: "Fin",
      sortable: true,
      className: "text-slate-600",
      render: (_, val) => fmtFecha(val),
    },
    {
      key: "monto_pagado",
      label: "Monto",
      sortable: true,
      render: (_, val) => <span className="font-bold text-blue-700">{money(val)}</span>,
    },
    {
      key: "metodo_pago",
      label: "Método",
      render: (row) => <MetodoBadge metodo={row.metodo_pago} />,
    },
    {
      key: "ingresos_disponibles",
      label: "Ingresos disp.",
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Clock size={10} className="text-slate-400" />
          <span className="text-slate-600">{row.ingresos_disponibles ?? "—"}</span>
        </div>
      ),
    },
  ];
}

/* ── página ──────────────────────────────────────────────────────────────── */

export default function DetalleAlumnoPage() {
  const { id } = useParams();
  const nav    = useNavigate();

  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getAlumnoDetalle(id);
      if (!r?.ok) { setError(r?.mensaje || "No se pudo cargar el alumno"); setData(null); return; }
      setData(r);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [id]);

  const alumno     = data?.alumno;
  const planActual = data?.plan_actual;
  const planes     = data?.planes || [];
  const resumen    = data?.resumen;

  const activo = useMemo(() => {
    const t = String(alumno?.estado_desc || "").toLowerCase();
    return !t.includes("restring") && !t.includes("bloq") && !t.includes("inactiv");
  }, [alumno]);

  const historialCols = useMemo(
    () => buildHistorialColumns(planActual?.plan_id),
    [planActual]
  );

  const nombreCompleto = alumno
    ? `${alumno.gym_persona_apellido} ${alumno.gym_persona_nombre}`
    : "Detalle de alumno";

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white shadow-sm ${activo ? "bg-blue-600 shadow-blue-500/30" : "bg-slate-400"}`}>
                {alumno ? iniciales(alumno.gym_persona_nombre, alumno.gym_persona_apellido) : "?"}
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {activo ? <BadgeCheck size={10} /> : <Ban size={10} />}
                  {alumno?.estado_desc || "—"}
                </span>
                <h1 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">{nombreCompleto}</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  DNI: {alumno?.gym_persona_documento || "—"}
                  {alumno?.gym_persona_email && <> · {alumno.gym_persona_email}</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => nav(-1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                <ArrowLeft size={14} /> Volver
              </button>
              <button type="button" onClick={cargar} disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50">
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
                {cargando ? "…" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── CARDS PLAN ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 px-4 py-4 shadow-sm shadow-blue-500/20">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-100">
              <CreditCard size={11} /> Plan actual
            </div>
            <p className="mt-1.5 text-xl font-extrabold text-white leading-tight">
              {cargando ? "…" : planActual?.tipoplan_desc || "Sin plan"}
            </p>
            <p className="mt-0.5 text-xs text-blue-200">
              {planActual?.fin ? `Vence: ${fmtFecha(planActual.fin)}` : "Sin plan vigente"}
            </p>
          </div>

          <div className={`rounded-2xl border px-4 py-4 shadow-sm ${planActual?.vigente_hoy && Number(planActual?.ingresos_disponibles ?? 0) > 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${planActual?.vigente_hoy && Number(planActual?.ingresos_disponibles ?? 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>
              <Zap size={11} /> Ingresos disp.
            </div>
            <p className={`mt-1.5 text-2xl font-extrabold leading-tight ${planActual?.vigente_hoy && Number(planActual?.ingresos_disponibles ?? 0) > 0 ? "text-emerald-700" : "text-red-700"}`}>
              {cargando ? "…" : planActual?.ingresos_disponibles ?? "—"}
            </p>
            <p className={`mt-0.5 text-xs ${planActual?.vigente_hoy ? "text-emerald-600" : "text-red-500"}`}>
              {planActual?.vigente_hoy ? "Plan vigente hoy" : "No vigente hoy"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp size={11} /> Total recaudado
            </div>
            <p className="mt-1.5 text-xl font-extrabold text-slate-900 leading-tight">
              {cargando ? "…" : money(resumen?.total_recaudado ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {resumen?.total_pagos ?? planes.length} {(resumen?.total_pagos ?? planes.length) === 1 ? "pago" : "pagos"}
            </p>
          </div>
        </div>

        {/* ── HISTORIAL ── */}
        <DataGrid
          title="Historial de planes / pagos"
          subtitle="Todos los pagos registrados para este alumno"
          rows={planes}
          columns={historialCols}
          keyField="plan_id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar por plan o método…"
          emptyMessage="No hay historial de planes/pagos para este alumno."
          pageSize={10}
          pageSizeOptions={[5, 10, 20]}
        />

      </div>
    </div>
  );
}
