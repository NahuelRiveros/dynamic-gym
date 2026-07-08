import { useEffect, useState } from "react";
import { BarChart2, TrendingDown } from "lucide-react";
import {
  getRecaudacionMensualStock,
  getProductosMasVendidos,
  getMermasDeStock,
} from "../../api/stock_api.js";

const ANIO_ACTUAL = new Date().getFullYear();

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(Number(n || 0));

export default function EstadisticasTab() {
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [cargando, setCargando] = useState(true);

  const [mensual, setMensual] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [mermas, setMermas] = useState([]);

  async function cargar(anioSeleccionado) {
    try {
      setCargando(true);
      const [rMensual, rRanking, rMermas] = await Promise.all([
        getRecaudacionMensualStock({ anio: anioSeleccionado }),
        getProductosMasVendidos({ anio: anioSeleccionado }),
        getMermasDeStock({ anio: anioSeleccionado }),
      ]);
      setMensual(rMensual.items || []);
      setRanking(rRanking.items || []);
      setMermas(rMermas.items || []);
    } catch {
      setMensual([]);
      setRanking([]);
      setMermas([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(anio); }, [anio]);

  const totalRecaudado = mensual.reduce((acc, m) => acc + Number(m.total_recaudado), 0);
  const totalUnidades = mensual.reduce((acc, m) => acc + Number(m.total_unidades), 0);
  const totalMermas = mermas.reduce((acc, m) => acc + Number(m.total_unidades), 0);
  const maxMensual = Math.max(1, ...mensual.map((m) => Number(m.total_recaudado)));
  const maxRanking = Math.max(1, ...ranking.map((r) => Number(r.total_ventas)));

  return (
    <div className="space-y-4">

      {/* ── SELECTOR DE AÑO ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Recaudación por mercadería, aparte de la recaudación por planes.
        </p>
        <div className="flex items-center gap-1">
          {[ANIO_ACTUAL - 1, ANIO_ACTUAL].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAnio(a)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                anio === a
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "border border-slate-200 text-slate-500 hover:bg-slate-50",
              ].join(" ")}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ResumenCard icono="💰" titulo="Recaudado en el año" valor={fmtARS(totalRecaudado)} color="emerald" />
        <ResumenCard icono="📦" titulo="Unidades vendidas" valor={String(totalUnidades)} color="blue" />
        <ResumenCard icono="⚠️" titulo="Unidades dadas de baja" valor={String(totalMermas)} color="amber" />
      </div>

      {cargando ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
          Cargando…
        </div>
      ) : (
        <>
          {/* ── RECAUDACIÓN MENSUAL ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <BarChart2 size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Recaudación mensual — {anio}</span>
            </div>
            <div className="px-5 py-5">
              {mensual.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">Sin ventas registradas para {anio}</div>
              ) : (
                <div className="space-y-2">
                  {mensual.map((m) => {
                    const pct = (Number(m.total_recaudado) / maxMensual) * 100;
                    return (
                      <div key={m.mes} className="flex items-center gap-3 text-xs">
                        <span className="w-8 shrink-0 font-bold text-slate-500">{MESES[m.mes - 1]}</span>
                        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-700"
                            style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right font-bold text-emerald-700">
                          {fmtARS(m.total_recaudado)}
                        </span>
                        <span className="w-16 shrink-0 text-right text-slate-400">{m.total_unidades} u.</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── PRODUCTOS MÁS VENDIDOS ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <BarChart2 size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-slate-800">Productos más vendidos — {anio}</span>
            </div>
            <div className="overflow-x-auto px-5 py-5">
              {ranking.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">Sin ventas registradas para {anio}</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-2 text-left w-6">#</th>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">Ventas</th>
                      <th className="px-3 py-2 text-right">Unidades</th>
                      <th className="px-3 py-2 text-right">Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ranking.map((item, idx) => {
                      const ancho = (Number(item.total_ventas) / maxRanking) * 100;
                      return (
                        <tr key={item.id} className={`transition hover:bg-slate-50 ${idx === 0 ? "bg-blue-50/40" : ""}`}>
                          <td className="px-3 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-semibold text-slate-700">
                            {idx === 0 && "🏆 "}{item.producto}
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <div className="relative h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${ancho}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-slate-800">{item.total_ventas}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">{fmtARS(item.total_recaudado)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── MERMAS ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <TrendingDown size={16} className="text-amber-600" />
              <span className="text-sm font-bold text-slate-800">Bajas por otro motivo — {anio}</span>
            </div>
            <div className="px-5 py-5">
              {mermas.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">Sin bajas registradas para {anio}</div>
              ) : (
                <div className="space-y-2">
                  {mermas.map((m) => (
                    <div key={m.motivo} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm">
                      <span className="font-semibold text-amber-800">{m.motivo}</span>
                      <span className="font-extrabold text-amber-700">{m.total_unidades} u.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ResumenCard({ icono, titulo, valor, color }) {
  const estilos = {
    blue:    "border-blue-100 bg-blue-50 text-blue-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber:   "border-amber-100 bg-amber-50 text-amber-700",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm ${estilos[color]}`}>
      <div className="text-lg leading-none">{icono}</div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider opacity-70">{titulo}</div>
      <div className="mt-1 text-xl font-extrabold leading-tight">{valor}</div>
    </div>
  );
}
