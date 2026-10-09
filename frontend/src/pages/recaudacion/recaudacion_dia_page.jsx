import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useRecaudacionDetalleDia } from "../../hook/use_recaudacion.js";
import {
  ArrowLeft, CalendarDays, TrendingUp, Receipt,
  Clock, User, Zap,
} from "lucide-react";

function money(v) {
  return Number(v || 0).toLocaleString("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  });
}

function horaCorta(fechaHora) {
  if (!fechaHora) return "—";
  const hora = String(fechaHora).split("T")[1];
  return hora ? hora.slice(0, 5) : "—";
}

function iniciales(nombre) {
  if (!nombre) return "?";
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

const METODO_STYLES = {
  EFECTIVO:      { bg: "bg-emerald-50 text-emerald-700 border-emerald-200",  label: "Efectivo" },
  TRANSFERENCIA: { bg: "bg-blue-50 text-blue-700 border-blue-200",            label: "Transferencia" },
  TARJETA:       { bg: "bg-violet-50 text-violet-700 border-violet-200",      label: "Tarjeta" },
  DEBITO:        { bg: "bg-orange-50 text-orange-700 border-orange-200",      label: "Débito" },
};

function MetodoBadge({ metodo }) {
  const key = String(metodo || "").toUpperCase();
  const style = METODO_STYLES[key] ?? { bg: "bg-slate-50 text-slate-600 border-slate-200", label: metodo || "—" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.bg}`}>
      {style.label}
    </span>
  );
}

export default function RecaudacionDetalleDiaPage() {
  const { anio, mes, dia } = useParams();
  const nav = useNavigate();

  const year  = Number(anio);
  const month = Number(mes);
  const day   = Number(dia);

  // Sin fecha válida en la dirección no se consulta (enabled: false).
  const consulta = useRecaudacionDetalleDia(year, month, day);
  const data = consulta.data;
  const cargando = consulta.isFetching;

  const totalDia       = useMemo(() => Number(data?.total_dia || 0), [data]);
  const cantidadCobros = useMemo(() => Number(data?.cantidad_cobros || 0), [data]);
  const promedio       = cantidadCobros > 0 ? Math.round(totalDia / cantidadCobros) : 0;

  const fechaTitulo = useMemo(() => {
    const f = new Date(year, month - 1, day);
    if (isNaN(f.getTime())) return "—";
    return f.toLocaleDateString("es-AR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
  }, [year, month, day]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <CalendarDays size={11} />
                Detalle del día
              </span>
              <h1 className="mt-2 text-xl font-extrabold capitalize text-slate-900 sm:text-2xl">
                {fechaTitulo}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Cobros registrados en esta fecha
              </p>
            </div>
            <button
              type="button"
              onClick={() => nav(`/estadisticas/recaudaciones/${year}/${month}`)}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm sm:self-auto"
            >
              <ArrowLeft size={14} />
              Volver al mes
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={cargando} />}

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<TrendingUp size={13} />} label="Total del día"       value={money(totalDia)}   highlight />
          <StatCard icon={<Receipt size={13} />}    label="Cobros"              value={cantidadCobros}   />
          <StatCard icon={<Zap size={13} />}        label="Ticket promedio"     value={promedio > 0 ? money(promedio) : "—"} />
        </div>

        {/* ── TABLA ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {cargando ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Hora
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Alumno
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden sm:table-cell">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Método
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 hidden md:table-cell">
                      Cobrado por
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                        No hay cobros registrados para este día.
                      </td>
                    </tr>
                  ) : (
                    (data?.items || []).map((item, idx) => (
                      <tr
                        key={`${item.gym_fecha_id ?? idx}-${item.fecha_hora ?? idx}`}
                        className="border-t border-slate-100 hover:bg-blue-50/40 transition"
                      >
                        {/* hora */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                            <Clock size={10} className="text-slate-400" />
                            {horaCorta(item.fecha_hora)}
                          </div>
                        </td>

                        {/* alumno */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white shadow-sm shadow-blue-500/30">
                              {iniciales(item.alumno)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">
                                {item.alumno || "—"}
                              </p>
                              {item.alumno_documento && (
                                <p className="text-[11px] text-slate-400 leading-tight">
                                  {item.alumno_documento}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* plan */}
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                          {item.plan || "—"}
                        </td>

                        {/* método */}
                        <td className="px-4 py-3">
                          <MetodoBadge metodo={item.metodo_pago} />
                        </td>

                        {/* cobrado por */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <User size={10} className="text-slate-400" />
                            {item.usuario_cobro || "—"}
                          </div>
                        </td>

                        {/* monto */}
                        <td className="px-4 py-3 text-right">
                          <span className="font-extrabold text-blue-700">
                            {money(item.monto)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* total footer */}
                {(data?.items || []).length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-blue-100 bg-blue-50/60">
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-slate-600 hidden md:table-cell">
                        Total
                      </td>
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold text-slate-600 md:hidden">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-base font-extrabold text-blue-700">
                        {money(totalDia)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── sub-components ── */

function StatCard({ icon, label, value, highlight }) {
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
    </div>
  );
}
