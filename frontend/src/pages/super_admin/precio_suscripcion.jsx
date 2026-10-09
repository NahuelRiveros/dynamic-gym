import { useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import FormError from "../../components/form/form_error.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useFijarPrecioSuscripcion } from "../../hook/use_suscripcion.js";
import { plata } from "../../lib/dinero.js";

/** Precio mensual del sistema: lo ve el admin del gimnasio y es lo que cobra Mercado Pago. */
export default function PrecioSuscripcion({ precioActual = 0 }) {
  const [precio, setPrecio] = useState(String(precioActual || ""));
  const fijar = useFijarPrecioSuscripcion();
  const nuevo = Number(precio);
  const valido = Number.isInteger(nuevo) && nuevo > 0;

  function guardar(e) {
    e.preventDefault();
    if (valido && nuevo !== precioActual) fijar.mutate(nuevo);
  }

  return (
    <form onSubmit={guardar} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Banknote aria-hidden="true" className="h-4 w-4 text-slate-400" />
        Precio mensual
      </h2>
      <p className="text-sm text-slate-500">
        Hoy: <strong className="text-slate-900">{plata(precioActual)}</strong>. El cambio lo ve el gimnasio al momento.
      </p>
      <label className="block text-sm font-medium text-slate-700">
        Nuevo precio (en pesos, sin centavos)
        <input
          type="text"
          inputMode="numeric"
          value={precio}
          onChange={(e) => {
            fijar.reset();
            setPrecio(e.target.value.replace(/\D/g, ""));
          }}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-lg font-bold tabular-nums outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>
      {valido && <p className="text-sm text-slate-600">Va a quedar en {plata(nuevo)} por mes.</p>}
      <FormError message={fijar.isError ? mensajeDeError(fijar.error, "No se pudo cambiar el precio") : null} />
      {fijar.isSuccess && (
        <p role="status" className="text-sm font-semibold text-emerald-700">
          Listo: el precio ahora es {plata(fijar.data.precio)}.
        </p>
      )}
      <button
        type="submit"
        disabled={!valido || nuevo === precioActual || fijar.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
      >
        {fijar.isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        Guardar precio
      </button>
    </form>
  );
}
