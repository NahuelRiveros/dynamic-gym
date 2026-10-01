import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useRecaudacionMensual } from "../../hook/use_recaudacion.js";
import {
  BarChart3, ChevronLeft, ChevronRight, RefreshCw, TrendingUp, Calendar,
} from "lucide-react";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function money(v) {
  return Number(v || 0).toLocaleString("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  });
}

export default function RecaudacionMensualPage() {
  const nav = useNavigate();
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  // Cambiar de año pide los datos solo; los años ya vistos quedan en caché (ir y volver es instantáneo).
  const consulta = useRecaudacionMensual(anio);
  const data = consulta.data;
  const cargando = consulta.isFetching;
  const cargar = () => consulta.refetch();

  const meses = useMemo(() => {
    const map = new Map();
    for (const it of data?.items || []) map.set(Number(it.mes), Number(it.total || 0));
    return Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: map.get(i + 1) ?? 0 }));
  }, [data]);

  const totalAnual      = useMemo(() => meses.reduce((acc, m) => acc + m.total, 0), [meses]);
  const maxMes          = useMemo(() => Math.max(0, ...meses.map(m => m.total)), [meses]);
  const mesesConDatos   = useMemo(() => meses.filter(m => m.total > 0).length, [meses]);
  const mesPico         = useMemo(() => meses.find(m => m.total === maxMes) ?? null, [meses, maxMes]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-5">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <BarChart3 size={11} />
                Finanzas
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Recaudación mensual</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Seleccioná un mes para ver el detalle diario
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAnio(a => a - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition"
              >
                <ChevronLeft size={16} className="text-slate-600" />
              </button>
              <span className="w-16 text-center text-xl font-extrabold text-slate-900">{anio}</span>
              <button
                type="button"
                onClick={() => setAnio(a => a + 1)}
                disabled={anio >= anioActual}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition disabled:opacity-40"
              >
                <ChevronRight size={16} className="text-slate-600" />
              </button>
              <button
                type="button"
                onClick={cargar}
                disabled={cargando}
                className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
                {cargando ? "…" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {consulta.isError && <EstadoError error={consulta.error} onReintentar={cargar} reintentando={cargando} />}

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={<TrendingUp size={14} />}
            label="Total anual"
            value={money(totalAnual)}
            highlight
          />
          <StatCard
            icon={<Calendar size={14} />}
            label="Meses con movimiento"
            value={`${mesesConDatos} / 12`}
          />
          <StatCard
            icon={<BarChart3 size={14} />}
            label="Mes pico"
            value={mesPico && maxMes > 0 ? MESES[mesPico.mes - 1] : "—"}
            sub={mesPico && maxMes > 0 ? money(maxMes) : ""}
          />
        </div>

        {/* ── GRID MESES ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {cargando
            ? Array.from({ length: 12 }).map((_, i) => <MonthSkeleton key={i} />)
            : meses.map(m => (
                <MonthCard
                  key={m.mes}
                  mes={m.mes}
                  total={m.total}
                  maxMes={maxMes}
                  onClick={() => nav(`/estadisticas/recaudaciones/${anio}/${m.mes}`)}
                />
              ))
          }
        </div>

      </div>
    </div>
  );
}

/* ────────────────── sub-components ────────────────── */

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div className={[
      "rounded-2xl border px-5 py-4 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20" : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : "text-slate-500"}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-2 text-2xl font-extrabold ${highlight ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className={`mt-0.5 text-sm ${highlight ? "text-blue-200" : "text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

function MonthCard({ mes, total, maxMes, onClick }) {
  const pct      = maxMes > 0 ? Math.round((total / maxMes) * 100) : 0;
  const tiene    = total > 0;
  const mesActual = new Date().getMonth() + 1;
  const esActual  = mes === mesActual;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group text-left rounded-2xl border p-4 transition hover:shadow-md hover:-translate-y-px focus:outline-none",
        tiene ? "border-blue-100 bg-blue-50/40 hover:bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
        esActual ? "ring-2 ring-blue-400/50" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {esActual ? "Este mes" : `Mes ${mes}`}
          </p>
          <p className="mt-0.5 text-base font-extrabold text-slate-900">
            {MESES[mes - 1]}
          </p>
        </div>
        <ChevronRight
          size={14}
          className="mt-0.5 shrink-0 text-slate-300 group-hover:text-slate-600 transition"
        />
      </div>

      <p className={`mt-3 text-lg font-extrabold leading-tight ${tiene ? "text-blue-700" : "text-slate-300"}`}>
        {tiene ? money(total) : "—"}
      </p>

      <div className="mt-3">
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${tiene ? "bg-blue-500" : "bg-slate-200"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          {tiene ? `${pct}% del máximo` : "Sin datos"}
        </p>
      </div>
    </button>
  );
}

function MonthSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-2.5 w-12 rounded bg-slate-100" />
      <div className="mt-1.5 h-5 w-24 rounded bg-slate-100" />
      <div className="mt-3 h-6 w-32 rounded bg-slate-100" />
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100" />
      <div className="mt-1.5 h-2.5 w-20 rounded bg-slate-100" />
    </div>
  );
}
