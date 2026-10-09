import { Link } from "react-router-dom";
import { CreditCard } from "lucide-react";
import SituacionBadge from "../../components/alumnos/situacion_badge.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { ingresosParaMostrar, situacionDelPlan } from "../../lib/situacion_plan.js";

const fecha = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) : "—");

function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <dt className="text-xs text-slate-500">{etiqueta}</dt>
      <dd className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">{valor}</dd>
    </div>
  );
}

/** El plan con el que entra hoy (o el último que tuvo): situación, días, ingresos y fechas. */
export default function TarjetaPlanActual({ plan = null, rutaCobrar }) {
  const situacion = situacionDelPlan(plan);

  return (
    <section aria-labelledby="titulo-plan" className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-plan" className="text-sm font-semibold text-slate-500">
          Plan actual
        </h2>
        <SituacionBadge situacion={situacion} grande />
      </div>

      {plan ? (
        <>
          <p className="mt-2 text-xl font-extrabold text-slate-900">{plan.tipoplan_desc || "—"}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2">
            <Dato etiqueta="Días que le quedan" valor={plan.vigente_hoy ? Math.max(0, Number(plan.dias_restantes ?? 0)) : 0} />
            <Dato etiqueta="Ingresos" valor={ingresosParaMostrar(plan)} />
            <Dato etiqueta="Desde" valor={fecha(plan.inicio)} />
            <Dato etiqueta="Vence" valor={fecha(plan.fin)} />
          </dl>
        </>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center">
          <p className="text-slate-600">Todavía no tiene ningún plan.</p>
          <Link to={rutaCobrar} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline">
            <CreditCard aria-hidden="true" className="h-4 w-4" />
            Cobrarle el primero
          </Link>
        </div>
      )}
    </section>
  );
}
