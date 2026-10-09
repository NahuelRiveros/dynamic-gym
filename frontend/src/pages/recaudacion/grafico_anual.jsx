import { cn } from "../../lib/cn.js";
import { COLOR, MESES, MESES_CORTOS, plata, plataCorta } from "./formato.js";

const ALTO = 200;

/**
 * Barras por mes, apiladas: planes abajo y productos arriba (separados por 2 px, punta redondeada
 * solo en la de arriba). Cada barra es un botón: al pasar el mouse o con el teclado muestra los
 * montos, y al tocarla abre el mes.
 */
export default function GraficoAnual({ meses = [], mesActual = null, onElegirMes }) {
  const maximo = Math.max(0, ...meses.map((m) => m.total));
  const escala = (valor) => (maximo > 0 ? (valor / maximo) * ALTO : 0);

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">Recaudación por mes</span>
        <span className="flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR.planes }} />
            Planes
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR.productos }} />
            Productos
          </span>
        </span>
      </figcaption>

      <div className="relative mt-6" style={{ height: ALTO + 24 }}>
        {maximo > 0 &&
          [1, 0.5].map((parte) => (
            <div key={parte} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ bottom: 24 + ALTO * parte }}>
              <span className="absolute -top-2.5 left-0 bg-white pr-1 text-[10px] text-slate-400">{plataCorta(maximo * parte)}</span>
            </div>
          ))}

        <ol className="absolute inset-0 grid grid-cols-12 items-end gap-1 pl-10 sm:gap-2">
          {meses.map((m) => {
            const actual = m.mes === mesActual;
            return (
              <li key={m.mes} className="flex h-full flex-col justify-end">
                <button
                  type="button"
                  onClick={() => onElegirMes(m.mes)}
                  aria-label={`${MESES[m.mes - 1]}: ${plata(m.total)} (planes ${plata(m.planes)}, productos ${plata(m.productos)})`}
                  className="group relative flex h-full flex-col justify-end rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-xs text-white shadow-lg group-hover:block group-focus-visible:block">
                    <span className="block font-semibold">{MESES[m.mes - 1]}: {plata(m.total)}</span>
                    <span className="block text-slate-300">Planes {plata(m.planes)}</span>
                    <span className="block text-slate-300">Productos {plata(m.productos)}</span>
                  </span>
                  <span className="mx-auto flex w-full max-w-8 flex-col justify-end gap-0.5" style={{ height: ALTO }}>
                    {m.productos > 0 && (
                      <span className="rounded-t-[4px]" style={{ height: escala(m.productos), backgroundColor: COLOR.productos }} />
                    )}
                    {m.planes > 0 && (
                      <span className={cn(m.productos > 0 ? "" : "rounded-t-[4px]")} style={{ height: escala(m.planes), backgroundColor: COLOR.planes }} />
                    )}
                  </span>
                  <span className={cn("mt-2 h-4 text-center text-[11px]", actual ? "font-bold text-slate-900" : "text-slate-500")}>
                    {MESES_CORTOS[m.mes - 1]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
