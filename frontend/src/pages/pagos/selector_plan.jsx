import { cn } from "../../lib/cn.js";
import { plata } from "../../lib/dinero.js";
import { ELEGIDA, OPCION } from "../../components/form/opcion_radio.js";

/** Los planes como tarjetas para elegir con un toque: precio, días e ingresos a la vista. */
export default function SelectorPlan({ planes = [], elegido, onElegir }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Plan</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {/* Los que no tienen precio van al final: no se pueden cobrar hasta cargarlo en Planes. */}
        {[...planes].sort((a, b) => (Number(b.precio) > 0) - (Number(a.precio) > 0)).map((plan) => {
          const sinPrecio = !(Number(plan.precio) > 0);
          return (
            <label key={plan.id} className={cn(OPCION, "p-4", elegido === plan.id ? ELEGIDA : "border-slate-200 hover:border-slate-300", sinPrecio && "cursor-not-allowed opacity-50")}>
              <input type="radio" name="plan" value={plan.id} checked={elegido === plan.id} disabled={sinPrecio} onChange={() => onElegir(plan.id)} className="sr-only" />
              <span className="block font-semibold text-slate-900">{plan.descripcion}</span>
              <span className="mt-1 block text-lg font-extrabold text-slate-900 tabular-nums">{sinPrecio ? "Sin precio" : plata(plan.precio)}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {plan.dias_totales} días · {Number(plan.ingresos) === 0 ? "ingresos libres" : `${plan.ingresos} ingresos`}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

