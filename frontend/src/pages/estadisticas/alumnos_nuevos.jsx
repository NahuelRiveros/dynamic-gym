import { useEffect, useMemo, useState } from "react";
import { getAlumnosNuevos } from "../../api/estadisticas_api";
import { Calendar, RefreshCw, Users, TrendingUp } from "lucide-react";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";

function primerDiaMesISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function iniciales(nombre, apellido) {
  return ((String(apellido || "")[0] || "") + (String(nombre || "")[0] || "")).toUpperCase() || "?";
}

const COLUMNS = [
  {
    key: "gym_persona_apellido",
    label: "Alumno",
    sortable: true,
    searchable: true,
    render: (row) => (
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white shadow-sm shadow-blue-500/30">
          {iniciales(row.gym_persona_nombre, row.gym_persona_apellido)}
        </div>
        <div>
          <p className="font-semibold text-slate-900 leading-tight">
            {row.gym_persona_apellido} {row.gym_persona_nombre}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "gym_persona_documento",
    label: "DNI",
    sortable: true,
    searchable: true,
    className: "text-slate-600",
  },
  {
    key: "gym_persona_email",
    label: "Email",
    searchable: true,
    className: "text-slate-500 hidden sm:table-cell",
    headerClassName: "hidden sm:table-cell",
    render: (_, val) => val || <span className="text-slate-300">—</span>,
  },
  {
    key: "gym_alumno_fecharegistro",
    label: "Fecha registro",
    sortable: true,
    className: "text-slate-600 hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
    render: (_, val) => val ? formatearFechaAR(String(val).slice(0, 10)) : "—",
  },
];

export default function AlumnosNuevosPage() {
  const [desde, setDesde] = useState(primerDiaMesISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getAlumnosNuevos({ desde, hasta });
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar alumnos nuevos");
        setData(null);
        return;
      }
      setData(r);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const items = data?.items || [];
  const total = items.length;

  const promedio = useMemo(() => {
    if (!desde || !hasta || total === 0) return "—";
    const d1 = new Date(desde);
    const d2 = new Date(hasta);
    const diff = Math.floor((d2 - d1) / 86400000) + 1;
    if (!Number.isFinite(diff) || diff <= 0) return "—";
    return (total / diff).toFixed(2);
  }, [total, desde, hasta]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Users size={11} />
                Alumnos
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Alumnos nuevos</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Registrados entre {desde} y {hasta}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <input
                  type="date" value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="text-sm text-slate-700 outline-none w-32"
                />
                <span className="text-slate-300">—</span>
                <input
                  type="date" value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="text-sm text-slate-700 outline-none w-32"
                />
              </div>
              <button
                type="button" onClick={cargar} disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
              >
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

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={<Users size={13} />}       label="Total alumnos nuevos" value={String(total)} highlight />
          <StatCard icon={<TrendingUp size={13} />}  label="Promedio diario"      value={promedio} />
          <StatCard icon={<Calendar size={13} />}    label="Rango"                value={`${desde.slice(8)} / ${desde.slice(5,7)} → ${hasta.slice(8)} / ${hasta.slice(5,7)}`} />
        </div>

        {/* ── TABLA ── */}
        <DataGrid
          rows={items}
          columns={COLUMNS}
          keyField="gym_alumno_id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar por nombre, apellido, DNI o email…"
          emptyMessage="No hay alumnos registrados en este rango."
          pageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
        />

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20" : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : "text-slate-500"}`}>
        {icon}{label}
      </div>
      <p className={`mt-1.5 text-xl font-extrabold leading-tight ${highlight ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
