import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlumnosListado, actualizarEstadosAlumnos } from "../../api/alumnos_api";
import { useAuth } from "../../auth/auth_context.jsx";
import { Users, RefreshCw, ChevronRight } from "lucide-react";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import DataGrid from "../../components/table/DataGrid";

/* ── badges ─────────────────────────────────────────────────────────────── */

function iniciales(nombre, apellido) {
  const n = String(nombre || "").trim()[0] || "";
  const a = String(apellido || "").trim()[0] || "";
  return (a + n).toUpperCase() || "?";
}

function EstadoBadge({ desc }) {
  const t = String(desc || "").toLowerCase();
  const ok = !t.includes("restring") && !t.includes("bloq") && !t.includes("inactiv");
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${ok ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
      {desc || "—"}
    </span>
  );
}

function PlanBadge({ vigente }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${vigente ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
      {vigente ? "Vigente" : "Sin plan"}
    </span>
  );
}

/* ── columnas ────────────────────────────────────────────────────────────── */

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
          {row.gym_persona_email && (
            <p className="text-[11px] text-slate-400 leading-tight">{row.gym_persona_email}</p>
          )}
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
    key: "estado_desc",
    label: "Estado",
    sortable: true,
    render: (row) => <EstadoBadge desc={row.estado_desc} />,
  },
  {
    key: "plan_tipo_desc",
    label: "Plan",
    render: (row) => (
      <div className="flex flex-col gap-1">
        <PlanBadge vigente={row.tiene_plan_vigente} />
        {row.plan_tipo_desc && <span className="text-[11px] text-slate-500">{row.plan_tipo_desc}</span>}
      </div>
    ),
  },
  {
    key: "plan_fin",
    label: "Vence",
    className: "text-slate-600 hidden md:table-cell",
    headerClassName: "hidden md:table-cell",
    render: (_, val) => val ? formatearFechaAR(String(val).slice(0, 10)) : "—",
  },
  {
    key: "ingresos_disponibles",
    label: "Ingresos",
    className: "text-slate-600 hidden sm:table-cell",
    headerClassName: "hidden sm:table-cell",
    render: (_, val) => val ?? "—",
  },
  {
    key: "_arrow",
    label: "",
    searchable: false,
    render: () => <ChevronRight size={14} className="text-slate-300" />,
    className: "text-right",
    headerClassName: "w-8",
  },
];

/* ── página ──────────────────────────────────────────────────────────────── */

export default function ListaAlumnosPage() {
  const nav = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.includes("admin");

  const [planVigente, setPlanVigente] = useState("");
  const [busqueda, setBusqueda]       = useState("");
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  async function cargar({ resetPage = false, qOverride, planVigenteOverride } = {}) {
    const nextPage = resetPage ? 1 : page;
    const q  = qOverride  !== undefined ? qOverride  : busqueda;
    const pv = planVigenteOverride !== undefined ? planVigenteOverride : planVigente;
    setCargando(true);
    setError(null);
    try {
      const params = {
        page: nextPage, limit,
        sort: "apellido", order: "asc",
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(pv        ? { plan_vigente: pv } : {}),
      };
      const r = await getAlumnosListado(params);
      if (!r?.ok) { setError(r?.mensaje || "No se pudo cargar alumnos"); setData(null); return; }
      setData(r);
      if (resetPage) setPage(1);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  function handleSearch(val) {
    setBusqueda(val);
    cargar({ resetPage: true, qOverride: val });
  }

  async function actualizarYRecargar() {
    setCargando(true);
    setError(null);
    if (esAdmin) {
      try { await actualizarEstadosAlumnos(); } catch {}
    }
    try {
      await cargar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error al recargar");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [page, limit]);

  const items = data?.items || [];
  const pag   = data?.pagination || { page: 1, totalPages: 1, total: 0, limit };

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
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Listado de alumnos</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {pag.total || 0} alumnos en total
              </p>
            </div>
            <button
              type="button"
              onClick={actualizarYRecargar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
              {cargando ? "…" : "Actualizar estados"}
            </button>
          </div>
        </div>

        {/* ── FILTRO PLAN ── */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={planVigente}
            onChange={(e) => { const val = e.target.value; setPlanVigente(val); cargar({ resetPage: true, planVigenteOverride: val }); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Plan (todos)</option>
            <option value="true">Con plan vigente</option>
            <option value="false">Sin plan vigente</option>
          </select>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── TABLA ── */}
        <DataGrid
          rows={items}
          columns={COLUMNS}
          keyField="gym_alumno_id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar por nombre, apellido, DNI o email…"
          onSearch={handleSearch}
          emptyMessage="No hay alumnos para mostrar."
          onRowClick={(row) => nav(`/admin/estadisticas/alumnos/${row.gym_alumno_id}`)}
          /* paginación server-side */
          page={pag.page}
          totalPages={pag.totalPages}
          totalRows={pag.total}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          pageSize={limit}
          pageSizeOptions={[10, 20, 30, 50]}
        />

      </div>
    </div>
  );
}
