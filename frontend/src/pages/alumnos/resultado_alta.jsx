import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CreditCard, UserPlus } from "lucide-react";
import { conPuntos } from "../../lib/dni.js";

/** Alta hecha: el paso siguiente natural es cobrarle el plan (sin plan no puede entrar). */
export default function ResultadoAlta({ persona, alumno, onOtro }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <section ref={ref} tabIndex={-1} aria-labelledby="titulo-alta" className="rounded-2xl border border-emerald-200 bg-white p-6 text-center outline-none">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
      </span>
      <h2 id="titulo-alta" className="mt-4 text-xl font-extrabold text-slate-900">
        Alta lista: {persona?.nombre} {persona?.apellido}
      </h2>
      <p className="mt-1 text-slate-600">DNI {conPuntos(persona?.documento)}. Para poder entrar le falta un plan.</p>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Link
          to={`/admin/pagos/registrar?dni=${persona?.documento}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <CreditCard aria-hidden="true" className="h-4 w-4" />
          Cobrarle el plan
        </Link>
        <button
          type="button"
          onClick={onOtro}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <UserPlus aria-hidden="true" className="h-4 w-4" />
          Dar de alta a otro
        </button>
      </div>
      {alumno?.alumno_id && (
        <Link to={`/admin/estadisticas/alumnos/${alumno.alumno_id}`} className="mt-4 inline-block text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline">
          Ver ficha
        </Link>
      )}
    </section>
  );
}
