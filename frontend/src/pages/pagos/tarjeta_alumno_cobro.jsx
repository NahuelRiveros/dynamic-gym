import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import SituacionBadge from "../../components/alumnos/situacion_badge.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { ingresosParaMostrar, situacionDelPlan } from "../../lib/situacion_plan.js";

/** A quién se le cobra: nombre, situación del plan actual y, si todavía le quedan días, el aviso. */
export default function TarjetaAlumnoCobro({ alumno, ultimoPago = null, onCambiar }) {
  const situacion = situacionDelPlan(ultimoPago);
  // Hoy entra con cualquiera de los dos planes: se pierden los días que quedaban después de hoy.
  const diasQuePierde = ultimoPago?.vigente_hoy ? Number(ultimoPago.dias_restantes ?? 0) : 0;

  return (
    <section aria-label="Alumno" className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-extrabold text-slate-900">
            {alumno.nombre} {alumno.apellido}
          </p>
          <p className="text-sm text-slate-500">DNI {alumno.documento}</p>
        </div>
        <div className="flex items-center gap-3">
          <SituacionBadge situacion={situacion} />
          <button type="button" onClick={onCambiar} className="text-sm font-semibold text-sky-700 hover:underline">
            Cambiar
          </button>
        </div>
      </div>

      {ultimoPago && (
        <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Plan actual</dt>
            <dd className="font-semibold text-slate-900">{ultimoPago.tipo_desc || "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Vence</dt>
            <dd className="font-semibold text-slate-900">{ultimoPago.fin ? formatearFechaAR(ultimoPago.fin) : "—"}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-xs text-slate-500">Ingresos</dt>
            <dd className="font-semibold text-slate-900">{ingresosParaMostrar(ultimoPago)}</dd>
          </div>
        </dl>
      )}

      {/* El plan nuevo empieza hoy y reemplaza al actual (pagos_service): hay que decirlo antes de cobrar. */}
      {diasQuePierde > 0 && (
        <p role="note" className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Todavía le {diasQuePierde === 1 ? "queda" : "quedan"} <strong>{diasQuePierde} {diasQuePierde === 1 ? "día" : "días"}</strong> del plan actual. El plan nuevo empieza hoy y reemplaza al actual: {diasQuePierde === 1 ? "ese día se pierde" : "esos días se pierden"}.
          </span>
        </p>
      )}

      <Link to={`/admin/estadisticas/alumnos/${alumno.alumno_id}`} className="mt-3 inline-block text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
        Ver ficha del alumno
      </Link>
    </section>
  );
}
