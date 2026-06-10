import { useEffect, useState } from "react";
import PlanFormModal from "../../components/modal/plan_form_modal";
import DataGrid from "../../components/table/DataGrid";
import {
  obtenerPlanes,
  crearPlan,
  actualizarPlan,
  cambiarEstadoPlan,
} from "../../api/planes_api.js";
import { Layers, Plus, Edit2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";

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
  const [planes, setPlanes]           = useState([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState("");
  const [modalAbierto, setModalAbierto]     = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [guardando, setGuardando]     = useState(false);

  async function cargarPlanes() {
    try {
      setCargando(true);
      setError("");
      const resp = await obtenerPlanes();
      setPlanes(resp.data || []);
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudieron cargar los planes");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarPlanes(); }, []);

  function abrirNuevo()       { setPlanSeleccionado(null); setModalAbierto(true); }
  function abrirEditar(plan)  { setPlanSeleccionado(plan); setModalAbierto(true); }
  function cerrarModal()      { setModalAbierto(false); setPlanSeleccionado(null); }

  async function guardarPlan(payload) {
    try {
      setGuardando(true);
      if (planSeleccionado) {
        await actualizarPlan(planSeleccionado.id, payload);
      } else {
        await crearPlan(payload);
      }
      cerrarModal();
      await cargarPlanes();
    } catch (err) {
      alert(err?.response?.data?.mensaje || "No se pudo guardar el plan");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(plan) {
    const nuevoEstado = !plan.activo;
    const accion = nuevoEstado ? "activar" : "desactivar";
    if (!window.confirm(`¿Seguro que querés ${accion} el plan "${plan.descripcion}"?`)) return;
    try {
      await cambiarEstadoPlan(plan.id, nuevoEstado);
      await cargarPlanes();
    } catch (err) {
      alert(err?.response?.data?.mensaje || `No se pudo ${accion} el plan`);
    }
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
                type="button" onClick={cargarPlanes} disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
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

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── TABLA ── */}
        <DataGrid
          rows={planes}
          columns={columns}
          keyField="id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar plan…"
          emptyMessage="No hay planes cargados."
          actions={actions}
          actionsLabel="Acciones"
          actionsPosition="end"
          pageSize={15}
          pageSizeOptions={[10, 15, 25]}
        />

      </div>

      <PlanFormModal
        abierto={modalAbierto}
        onClose={cerrarModal}
        onGuardar={guardarPlan}
        planEditar={planSeleccionado}
        cargando={guardando}
      />
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
