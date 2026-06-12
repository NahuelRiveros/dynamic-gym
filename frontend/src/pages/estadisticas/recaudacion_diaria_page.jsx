import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getRecaudacionDiasDeMes } from "../../api/recaudacion_api";
import {
  ChevronLeft, ChevronRight, ArrowLeft,
  CalendarDays, TrendingUp, Star, Activity,
  Zap, Trophy, Banknote,
} from "lucide-react";

const NOMBRES_DIA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function money(v) {
  return Number(v || 0).toLocaleString("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  });
}
function moneyCompact(v) {
  return Number(v || 0).toLocaleString("es-AR", {
    notation: "compact", maximumFractionDigits: 1,
  });
}

export default function RecaudacionDiariaPage() {
  const { anio, mes } = useParams();
  const nav = useNavigate();

  const year  = Number(anio);
  const month = Number(mes);

  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!Number.isFinite(year) || !Number.isFinite(month)) return;
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const r = await getRecaudacionDiasDeMes(year, month);
        if (!r?.ok) { setError(r?.mensaje || "No se pudo cargar recaudación diaria"); setData(null); return; }
        setData(r);
      } catch (e) {
        setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
        setData(null);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [year, month]);

  const diasDelMes = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  const mapaDias = useMemo(() => {
    const map = new Map();
    for (const it of data?.items || []) {
      const dia = Number(String(it.dia).slice(8, 10));
      map.set(dia, Number(it.total || 0));
    }
    return map;
  }, [data]);

  const totalMes    = useMemo(() => Array.from(mapaDias.values()).reduce((a, v) => a + v, 0), [mapaDias]);
  const maxDia      = useMemo(() => Math.max(0, ...Array.from(mapaDias.values())), [mapaDias]);
  const dias        = useMemo(() => Array.from({ length: diasDelMes }, (_, i) => i + 1), [diasDelMes]);
  const diasActivos = mapaDias.size;
  const promedio    = diasActivos > 0 ? Math.round(totalMes / diasActivos) : 0;
  const diaPico     = useMemo(() => {
    for (const [d, t] of mapaDias) if (t === maxDia) return d;
    return null;
  }, [mapaDias, maxDia]);

  function navMes(delta) {
    const d = new Date(year, month - 1 + delta);
    nav(`/estadisticas/recaudaciones/${d.getFullYear()}/${d.getMonth() + 1}`);
  }
  function diaSemana(dia) { return NOMBRES_DIA[new Date(year, month - 1, dia).getDay()]; }
  function esFinDeSemana(dia) {
    const dow = new Date(year, month - 1, dia).getDay();
    return dow === 0 || dow === 6;
  }

  const hoy   = new Date();
  const esHoy = (dia) =>
    hoy.getFullYear() === year && hoy.getMonth() + 1 === month && hoy.getDate() === dia;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          {/* franja azul eléctrica superior */}
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />

          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            {/* izquierda */}
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <CalendarDays size={11} />
                Recaudación Diaria
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {MESES[month - 1]} {year}
                </h1>
                {!cargando && totalMes > 0 && (
                  <span className="text-base font-bold text-blue-600">{money(totalMes)}</span>
                )}
                {!cargando && !error && totalMes === 0 && (
                  <span className="text-sm text-slate-400">Sin recaudación</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Seleccioná un día para ver el detalle
              </p>
            </div>

            {/* derecha: nav */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nav("/estadisticas/recaudaciones-mensual")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all"
                title="Volver a vista mensual"
              >
                <ArrowLeft size={15} />
                <span>Volver</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navMes(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 transition"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => navMes(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 transition"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── STATS ── */}
        {!cargando && totalMes > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<TrendingUp size={13} />} label="Total del mes"   value={money(totalMes)}                   highlight />
            <StatCard icon={<CalendarDays size={13} />} label="Días activos"  value={`${diasActivos} / ${diasDelMes}`} />
            <StatCard icon={<Star size={13} />}         label="Día pico"      value={diaPico ? String(diaPico) : "—"}   sub={diaPico ? money(maxDia) : ""} />
            <StatCard icon={<Activity size={13} />}     label="Prom. por día" value={promedio > 0 ? moneyCompact(promedio) : "—"} />
          </div>
        )}

        {/* ── GRID DÍAS ── */}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {cargando
            ? Array.from({ length: diasDelMes || 30 }).map((_, i) => (
                <DaySkeleton key={i} />
              ))
            : dias.map((dia) => {
                const total   = mapaDias.get(dia) ?? 0;
                const tiene   = total > 0;
                const pct     = maxDia > 0 && tiene ? total / maxDia : 0;
                const isHoy   = esHoy(dia);
                const isWknd  = esFinDeSemana(dia);
                const isPico  = tiene && dia === diaPico;

                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => nav(`/estadisticas/recaudaciones/${year}/${month}/${dia}/detalle`)}
                    className={[
                      "group relative flex flex-col justify-between rounded-2xl border p-2.5 min-h-27 text-left transition",
                      "focus:outline-none",
                      tiene
                        ? "border-blue-200 bg-blue-50 hover:bg-blue-100/60 hover:shadow-md hover:shadow-blue-500/15 hover:-translate-y-0.5"
                        : isWknd
                        ? "border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:-translate-y-0.5"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:-translate-y-0.5",
                      isHoy ? "ring-2 ring-blue-500 ring-offset-1 shadow-md shadow-blue-500/20" : "",
                    ].join(" ")}
                  >
                    {/* badge HOY */}
                    {isHoy && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r from-blue-600 to-cyan-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm shadow-blue-500/40">
                        Hoy
                      </span>
                    )}

                    {/* fila superior: día semana + número + ícono pico */}
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${tiene ? "text-blue-500" : "text-slate-400"}`}>
                        {diaSemana(dia)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {isPico && (
                          <Trophy size={10} className="text-amber-400 shrink-0" />
                        )}
                        <span className={`text-base font-extrabold leading-none ${isHoy ? "text-blue-600" : tiene ? "text-slate-800" : "text-slate-400"}`}>
                          {dia}
                        </span>
                      </div>
                    </div>

                    {/* fila inferior: barra + monto con ícono */}
                    <div className="mt-auto">
                      {tiene ? (
                        <>
                          <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-blue-100">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                              style={{ width: `${Math.max(4, Math.round(pct * 100))}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Zap size={9} className="shrink-0 text-blue-400" />
                            <p className="text-[11px] font-bold leading-tight text-blue-700">
                              <span className="sm:hidden">{moneyCompact(total)}</span>
                              <span className="hidden sm:block">{money(total)}</span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <Banknote size={9} className="shrink-0 text-slate-200" />
                          <p className="text-[10px] font-medium text-slate-300">—</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
        </div>

      </div>
    </div>
  );
}

/* ── sub-components ── */

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight
        ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : "text-slate-500"}`}>
        {icon}
        {label}
      </div>
      <p className={`mt-1.5 text-xl font-extrabold leading-tight ${highlight ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className={`mt-0.5 text-xs ${highlight ? "text-blue-200" : "text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

function DaySkeleton() {
  return (
    <div className="h-27 rounded-2xl border border-slate-100 bg-slate-100 animate-pulse" />
  );
}
