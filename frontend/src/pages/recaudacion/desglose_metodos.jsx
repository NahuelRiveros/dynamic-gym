import { Wallet } from "lucide-react";
import { nombreMetodo, plata } from "./formato.js";

/** Cuánto entró por cada método de pago: lo que se cuenta al cerrar la caja. */
export default function DesgloseMetodos({ metodos = [], titulo = "Por método de pago" }) {
  const total = metodos.reduce((acc, m) => acc + m.total, 0);

  return (
    <section aria-labelledby="titulo-metodos" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 id="titulo-metodos" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Wallet aria-hidden="true" className="h-4 w-4 text-slate-400" />
        {titulo}
      </h2>
      {metodos.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Sin movimientos.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {metodos.map(({ metodo, total: monto }) => {
            const porcentaje = total > 0 ? Math.round((monto / total) * 100) : 0;
            return (
              <li key={metodo}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{nombreMetodo(metodo)}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {plata(monto)} <span className="font-normal text-slate-500">· {porcentaje}%</span>
                  </span>
                </div>
                <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-700" style={{ width: `${porcentaje}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
