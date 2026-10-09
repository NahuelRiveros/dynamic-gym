import { useState, useRef } from "react";
import {
  Search,
  User,
  CreditCard,
  CalendarDays,
  Zap,
  BadgeCheck,
  Ban,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { consultarPlanPorDni } from "../api/alumnos_api";
import { formatearFechaAR } from "../components/form/formatear_fecha";

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fmtFecha(val) {
  if (!val) return "—";
  return formatearFechaAR(String(val).slice(0, 10)) || "—";
}

function iniciales(nombre = "", apellido = "") {
  return (
    (String(apellido)[0] || "") + (String(nombre)[0] || "")
  ).toUpperCase() || "?";
}

function DiasChip({ dias }) {
  if (dias == null) return null;

  if (dias < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
        <AlertCircle size={11} /> Vencido hace {Math.abs(dias)} días
      </span>
    );
  }
  if (dias === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-700">
        <Clock size={11} /> Vence hoy
      </span>
    );
  }
  if (dias <= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 border border-yellow-200 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
        <Clock size={11} /> Vence en {dias} día{dias === 1 ? "" : "s"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
      <CheckCircle2 size={11} /> {dias} días restantes
    </span>
  );
}

/* ── página ───────────────────────────────────────────────────────────────── */

export default function ConsultaPlanPage() {
  const [dni, setDni]         = useState("");
  const [resultado, setRes]   = useState(null);   // null | { ok, alumno, plan_actual }
  const [cargando, setCarg]   = useState(false);
  const [error, setError]     = useState(null);
  const inputRef              = useRef(null);

  async function buscar(e) {
    e?.preventDefault();
    const dniLimpio = dni.replace(/\D/g, "").trim();
    if (!dniLimpio) { inputRef.current?.focus(); return; }

    setCarg(true);
    setError(null);
    setRes(null);

    try {
      const r = await consultarPlanPorDni(dniLimpio);
      if (!r.ok) {
        setError(r.mensaje || "No se encontró ningún alumno con ese DNI");
        return;
      }
      setRes(r);
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "Error al consultar. Intentá de nuevo.";
      setError(msg);
    } finally {
      setCarg(false);
    }
  }

  function limpiar() {
    setDni("");
    setRes(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const alumno     = resultado?.alumno;
  const plan       = resultado?.plan_actual;
  const activo     = alumno
    ? !String(alumno.estado_desc || "").toLowerCase().match(/restring|bloq|inactiv/)
    : false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-10 sm:py-16">

      {/* ── TÍTULO ── */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4">
          <CreditCard size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Consultar mi plan</h1>
        <p className="mt-1.5 text-slate-500 text-sm max-w-xs mx-auto">
          Ingresá tu DNI para ver el estado de tu membresía
        </p>
      </div>

      {/* ── FORMULARIO ── */}
      <form
        onSubmit={buscar}
        className="w-full max-w-sm"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={10}
              value={dni}
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej: 32456789"
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-base font-mono font-semibold text-slate-800 shadow-sm outline-none ring-0 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:font-normal placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={cargando || !dni}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Buscar"}
          </button>
        </div>
      </form>

      {/* ── ERROR ── */}
      {error && (
        <div className="mt-6 w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button onClick={limpiar} className="mt-1 text-xs text-red-500 underline underline-offset-2">
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTADO ── */}
      {resultado && (
        <div className="mt-6 w-full max-w-sm space-y-3">

          {/* Card: alumno */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
            <div className="flex items-center gap-3 px-5 py-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white shadow-sm ${activo ? "bg-blue-600 shadow-blue-500/25" : "bg-slate-400"}`}>
                {iniciales(alumno.nombre, alumno.apellido)}
              </div>
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${activo ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {activo ? <BadgeCheck size={10} /> : <Ban size={10} />}
                  {alumno.estado_desc || "—"}
                </span>
                <p className="mt-0.5 text-lg font-extrabold text-slate-900 truncate">
                  {alumno.apellido} {alumno.nombre}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <User size={10} /> DNI {Number(alumno.documento).toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {/* Card: plan */}
          {plan ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 space-y-3">

                {/* nombre del plan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <CreditCard size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Plan</p>
                      <p className="text-base font-extrabold text-slate-900 leading-tight">
                        {plan.tipoplan_desc || "—"}
                      </p>
                    </div>
                  </div>
                  <DiasChip dias={plan.dias_restantes} />
                </div>

                <div className="h-px bg-slate-100" />

                {/* fechas + ingresos */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <CalendarDays size={13} className="text-slate-400" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Inicio</p>
                    <p className="text-sm font-bold text-slate-800">{fmtFecha(plan.inicio)}</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <div className="flex justify-center mb-1">
                      <CalendarDays size={13} className="text-slate-400" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Vence</p>
                    <p className="text-sm font-bold text-slate-800">{fmtFecha(plan.fin)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      <Zap size={13} className={plan.vigente_hoy && Number(plan.ingresos_disponibles ?? 0) > 0 ? "text-emerald-500" : "text-red-400"} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ingresos</p>
                    <p className={`text-sm font-extrabold ${plan.vigente_hoy && Number(plan.ingresos_disponibles ?? 0) > 0 ? "text-emerald-700" : "text-red-600"}`}>
                      {plan.ingresos_disponibles ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Alerta sin ingresos / plan vencido */}
                {plan.vigente_hoy && Number(plan.ingresos_disponibles ?? 0) === 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700">
                    <AlertCircle size={13} /> Sin ingresos disponibles. Renovar plan.
                  </div>
                )}
                {!plan.vigente_hoy && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                    <Ban size={13} /> Plan vencido. Acercate al gimnasio para renovar.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm font-semibold text-orange-700 flex items-center gap-2">
              <AlertCircle size={16} /> Este alumno no tiene planes registrados.
            </div>
          )}

          {/* Botón nueva consulta */}
          <button
            onClick={limpiar}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            Nueva consulta
          </button>
        </div>
      )}

    </div>
  );
}
