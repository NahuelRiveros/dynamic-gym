import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { nombreMetodo, plata } from "../../lib/dinero.js";

/**
 * Cobro hecho: queda en pantalla (no se cierra solo) con lo que se cobró y los próximos pasos.
 * El foco va al resultado para que el lector de pantalla lo anuncie.
 */
export default function ResultadoCobro({ resultado, onOtro }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  const { alumno, plan, pago } = resultado;

  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="titulo-cobro" className="rounded-2xl border border-emerald-200 bg-white p-6 text-center outline-none">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
      </span>
      <h2 id="titulo-cobro" className="mt-4 text-xl font-extrabold text-slate-900">
        Cobrado: {plata(pago?.monto_pagado)} en {nombreMetodo(pago?.metodo_pago).toLowerCase()}
      </h2>
      <p className="mt-1 text-slate-600">
        {alumno?.nombre} {alumno?.apellido} ya puede entrar.
      </p>
      <p className="mt-3 inline-block rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
        {plan?.tipo_plan_descripcion}: del {formatearFechaAR(plan?.inicio)} al {formatearFechaAR(plan?.fin)}
        {Number(plan?.ingresos_disponibles) > 0 ? ` · ${plan.ingresos_disponibles} ingresos` : " · ingresos libres"}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onOtro}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Cobrar a otro alumno
        </button>
        <Link
          to={`/admin/estadisticas/alumnos/${alumno?.alumno_id}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Ver ficha
        </Link>
      </div>
    </section>
  );
}
