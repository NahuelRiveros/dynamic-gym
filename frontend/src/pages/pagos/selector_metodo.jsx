import { cn } from "../../lib/cn.js";
import { ELEGIDA, OPCION } from "../../components/form/opcion_radio.js";

const METODOS_PAGO = [
  { valor: "EFECTIVO", texto: "Efectivo" },
  { valor: "TRANSFERENCIA", texto: "Transferencia" },
  { valor: "MERCADO PAGO", texto: "Mercado Pago" },
  { valor: "DÉBITO", texto: "Débito" },
  { valor: "CRÉDITO", texto: "Crédito" },
];

/** Cómo paga: un botón por método (más rápido que un desplegable). */
export default function SelectorMetodo({ elegido, onElegir }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Método de pago</legend>
      <div className="flex flex-wrap gap-2">
        {METODOS_PAGO.map(({ valor, texto }) => (
          <label key={valor} className={cn(OPCION, "px-4 py-2.5 text-sm font-medium", elegido === valor ? ELEGIDA + " text-sky-800" : "border-slate-200 text-slate-700 hover:border-slate-300")}>
            <input type="radio" name="metodo" value={valor} checked={elegido === valor} onChange={() => onElegir(valor)} className="sr-only" />
            {texto}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
