import { useMemo, useState } from "react";
import { CalendarClock, RefreshCw, AlertTriangle, Clock, Zap, User } from "lucide-react";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { hoyISOArgentina } from "../../components/form/formatear_fecha.js";
import { useVencimientos } from "../../hook/use_estadisticas.js";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtFecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function diasEntre(hoyISO, finISO) {
  if (!finISO) return null;
  const diff = Math.ceil((new Date(String(finISO).slice(0, 10)) - new Date(hoyISO)) / 86400000);
  return Number.isFinite(diff) ? diff : null;
}

function iniciales(nombre, apellido) {
  return ((String(apellido || "")[0] || "") + (String(nombre || "")[0] || "")).toUpperCase() || "?";
}

function UrgenciaBadge({ dias }) {
  if (dias === null) return <span className="text-slate-400 text-xs">—</span>;
  if (dias < 0)  return <Badge red><AlertTriangle size={10} /> Vencido</Badge>;
  if (dias === 0) return <Badge red><AlertTriangle size={10} /> Hoy</Badge>;
  if (dias <= 2) return <Badge red><Zap size={9} /> {dias}d</Badge>;
  if (dias <= 5) return <Badge amber><Clock size={9} /> {dias}d</Badge>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">{dias}d</span>;
}

function Badge({ red, amber, children }) {
  const cls = red
    ? "bg-red-50 text-red-700 border-red-200"
    : amber
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

/* ── página ──────────────────────────────────────────────────────────────── */

export default function VencimientosPage() {
  const [dias, setDias] = useState(7);
  // Cambiar los días pide los datos solo (cambia la queryKey); "Actualizar" los vuelve a pedir.
  const consulta = useVencimientos(dias);
  const cargando = consulta.isFetching;

  const hoyISO = useMemo(() => hoyISOArgentina(), []);

  const items    = useMemo(() => consulta.data?.items || [], [consulta.data]);
  const total    = Number(consulta.data?.total || 0);
  const urgentes = useMemo(() =>
    items.filter((it) => { const d = diasEntre(hoyISO, it.fin); return d !== null && d <= 2; }).length,
    [items, hoyISO]
  );

  /* ── columnas ── */
  const columns = useMemo(() => [
    {
      key: "apellido",
      label: "Alumno",
      sortable: true,
      searchable: true,
      render: (row) => {
        const diasRest = diasEntre(hoyISO, row.fin);
        const critico  = diasRest !== null && diasRest <= 2;
        return (
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-sm ${critico ? "bg-red-500" : "bg-blue-600 shadow-blue-500/30"}`}>
              {iniciales(row.nombre, row.apellido)}
            </div>
            <span className="font-semibold text-slate-900">{row.apellido} {row.nombre}</span>
          </div>
        );
      },
    },
    {
      key: "documento",
      label: "DNI",
      sortable: true,
      searchable: true,
      className: "text-slate-600",
    },
    {
      key: "plan",
      label: "Plan",
      className: "text-slate-600",
      render: (_, val) => val || "—",
    },
    {
      key: "inicio",
      label: "Inicio",
      sortable: true,
      className: "text-slate-600 hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
      render: (_, val) => fmtFecha(val),
    },
    {
      key: "fin",
      label: "Vence el",
      sortable: true,
      render: (row) => {
        const diasRest = diasEntre(hoyISO, row.fin);
        const critico  = diasRest !== null && diasRest <= 2;
        return (
          <span className={critico ? "font-bold text-red-700" : "text-slate-600"}>
            {fmtFecha(row.fin)}
          </span>
        );
      },
    },
    {
      key: "ingresos_disponibles",
      label: "Ingresos",
      className: "hidden md:table-cell",
      headerClassName: "hidden md:table-cell",
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <User size={10} className="text-slate-400" />
          <span className="text-slate-600">{row.ingresos_disponibles ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "_urgencia",
      label: "Vence en",
      render: (row) => <UrgenciaBadge dias={diasEntre(hoyISO, row.fin)} />,
    },
  ], [hoyISO]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <CalendarClock size={11} />
                Estadísticas
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Vencimientos próximos</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Planes que vencen en los próximos {dias} días
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Días</span>
                <input
                  type="number" min={1} max={60}
                  value={dias}
                  onChange={(e) => setDias(Number(e.target.value || 7))}
                  className="w-14 text-sm font-bold text-slate-800 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => consulta.refetch()}
                disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
                {cargando ? "…" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<CalendarClock size={13} />} label="Total"     value={String(total)}    highlight />
          <StatCard icon={<AlertTriangle size={13} />} label="Críticos ≤2d" value={String(urgentes)} urgent={urgentes > 0} />
          <StatCard icon={<Clock size={13} />}         label="Rango"     value={`+${dias} días`} />
        </div>

        {/* ── ERROR ── */}
        {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={cargando} />}

        {/* ── TABLA ── */}
        <DataGrid
          rows={items}
          columns={columns}
          keyField="alumno_id"
          loading={cargando}
          searchable
          searchPlaceholder="Buscar por nombre, apellido o DNI…"
          emptyMessage="No hay vencimientos en este rango."
          pageSize={15}
          pageSizeOptions={[10, 15, 25, 50]}
        />

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight, urgent }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20"
        : urgent  ? "border-red-200 bg-red-50"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : urgent ? "text-red-500" : "text-slate-500"}`}>
        {icon}{label}
      </div>
      <p className={`mt-1.5 text-xl font-extrabold leading-tight ${highlight ? "text-white" : urgent ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
