import { useMemo, useState } from "react";
import { Activity, RefreshCw, Calendar, Trophy, Clock, Zap } from "lucide-react";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useHeatmapAsistencias } from "../../hook/use_estadisticas.js";
import { useFiltros } from "../../hook/use_filtros.js";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function isoMesActual() {
  const hoy = new Date();
  return {
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

// Convierte un valor 0..1 en un color azul eléctrico con distintos niveles de intensidad
function celColor(alpha) {
  if (alpha <= 0) return { bg: "rgba(241,245,249,0.8)", border: "rgba(203,213,225,0.6)", text: "rgba(148,163,184,0.8)" };
  const intensity = Math.max(0.08, alpha);
  return {
    bg:     `rgba(37, 99, 235, ${intensity})`,
    border: `rgba(37, 99, 235, ${Math.min(1, intensity + 0.2)})`,
    text:   alpha > 0.5 ? "rgba(255,255,255,0.95)" : alpha > 0.15 ? "rgba(30,64,175,0.9)" : "rgba(148,163,184,0)",
  };
}

export default function HeatmapAsistenciasPage() {
  const def = useMemo(() => isoMesActual(), []);
  const [desde, setDesde] = useState(def.desde);
  const [hasta, setHasta] = useState(def.hasta);
  // La consulta usa el rango aplicado con "Actualizar", no el que se está escribiendo.
  const [filtros, aplicarFiltros] = useFiltros(def);
  const consulta = useHeatmapAsistencias(filtros);
  const data = consulta.data;
  const cargando = consulta.isFetching;

  function actualizar() {
    if (!aplicarFiltros({ desde, hasta })) consulta.refetch();
  }

  /* ── procesamiento ── */
  const { matriz, maxVal, pico, totalIngresos, diaMasConcurrido, horaMasConcurrida } = useMemo(() => {
    const matriz = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxVal = 0;
    let pico   = null;

    // totales por día y por hora
    const totalesDia  = Array(7).fill(0);
    const totalesHora = Array(24).fill(0);
    let totalIngresos = 0;

    for (const it of data?.items || []) {
      const d = Number(it.dia_semana);
      const h = Number(it.hora);
      const c = Number(it.total || 0);
      if (d >= 0 && d <= 6 && h >= 0 && h <= 23) {
        matriz[d][h] = c;
        totalesDia[d]  += c;
        totalesHora[h] += c;
        totalIngresos  += c;
        if (c > maxVal) { maxVal = c; pico = { d, h, c }; }
      }
    }

    const diaMasConcurrido  = totalesDia.indexOf(Math.max(...totalesDia));
    const horaMasConcurrida = totalesHora.indexOf(Math.max(...totalesHora));

    return { matriz, maxVal, pico, totalIngresos, diaMasConcurrido, horaMasConcurrida };
  }, [data]);

  const HORAS_UTILES = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Activity size={11} />
                Concurrencia
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Heatmap de asistencias</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Intensidad por hora y día de la semana · {filtros.desde} → {filtros.hasta}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                  className="text-sm text-slate-700 outline-none w-32" />
                <span className="text-slate-300">—</span>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                  className="text-sm text-slate-700 outline-none w-32" />
              </div>
              <button type="button" onClick={actualizar} disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50">
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
                {cargando ? "…" : "Actualizar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── ERROR ── */}
        {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={cargando} />}

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Zap size={13} />}      label="Total ingresos"   value={String(totalIngresos)} highlight />
          <StatCard icon={<Trophy size={13} />}   label="Día más concurrido"
            value={totalIngresos > 0 ? DIAS_FULL[diaMasConcurrido] : "—"} />
          <StatCard icon={<Clock size={13} />}    label="Hora pico"
            value={totalIngresos > 0 ? `${String(horaMasConcurrida).padStart(2,"0")}:00` : "—"} />
          <StatCard icon={<Activity size={13} />} label="Slot pico"
            value={pico ? `${DIAS[pico.d]} ${String(pico.h).padStart(2,"0")}:00` : "—"}
            sub={pico ? `${pico.c} ingresos` : ""} />
        </div>

        {/* ── HEATMAP ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* leyenda */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Mapa de calor</span>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Menos</span>
              <div className="flex items-center gap-0.5">
                {[0.04, 0.15, 0.35, 0.6, 0.85, 1].map((a) => {
                  const c = celColor(a);
                  return <span key={a} className="h-3.5 w-5 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.border}` }} />;
                })}
              </div>
              <span>Más</span>
            </div>
          </div>

          <div className="overflow-x-auto p-3">
            {cargando ? (
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-10 rounded bg-slate-100 animate-pulse shrink-0" />
                    <div className="h-8 flex-1 rounded-xl bg-slate-100 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ minWidth: "900px" }}>
                {/* header de horas */}
                <div className="grid mb-1" style={{ gridTemplateColumns: "56px repeat(24, 1fr)" }}>
                  <div />
                  {HORAS_UTILES.map((h) => (
                    <div key={h} className={`text-center text-[10px] font-bold pb-1 ${h === horaMasConcurrida && totalIngresos > 0 ? "text-blue-600" : "text-slate-400"}`}>
                      {String(h).padStart(2, "0")}
                    </div>
                  ))}
                </div>

                {/* filas por día */}
                <div className="space-y-1">
                  {Array.from({ length: 7 }, (_, d) => {
                    const esDiaPico = d === diaMasConcurrido && totalIngresos > 0;
                    return (
                      <div key={d} className="grid items-center gap-0.5" style={{ gridTemplateColumns: "56px repeat(24, 1fr)" }}>
                        <div className={`text-[11px] font-bold pr-1 text-right ${esDiaPico ? "text-blue-600" : "text-slate-500"}`}>
                          {DIAS[d]}
                          {esDiaPico && <Trophy size={9} className="inline ml-0.5 text-amber-400" />}
                        </div>
                        {HORAS_UTILES.map((h) => {
                          const val   = matriz[d][h];
                          const alpha = maxVal > 0 ? val / maxVal : 0;
                          const c     = celColor(alpha);
                          const isPico = pico?.d === d && pico?.h === h;
                          return (
                            <div
                              key={h}
                              title={`${DIAS_FULL[d]} ${String(h).padStart(2,"0")}:00 → ${val} ingreso${val !== 1 ? "s" : ""}`}
                              className={`flex h-8 items-center justify-center rounded-md text-[10px] font-bold transition-all ${isPico ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}
                              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
                            >
                              {val > 0 ? val : ""}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, highlight }) {
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
      {sub && <p className={`mt-0.5 text-xs ${highlight ? "text-blue-200" : "text-slate-500"}`}>{sub}</p>}
    </div>
  );
}
