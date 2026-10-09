import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";
import { plata, plataCorta } from "./formato.js";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Lunes = 0 ... domingo = 6. En UTC para que la zona horaria del navegador no corra el día. */
const diaSemana = (anio, mes, dia) => (new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay() + 6) % 7;

/**
 * Calendario del mes (empieza en lunes, cada día en su columna). Un día con cobros muestra el
 * monto y lleva al detalle; los días que todavía no llegaron no se pueden abrir.
 */
export default function CalendarioMes({ anio, mes, porDia, hoy, rutaDia }) {
  const cantidad = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const vacios = diaSemana(anio, mes, 1);
  const dias = Array.from({ length: cantidad }, (_, i) => i + 1);
  const futuro = (dia) => anio > hoy.anio || (anio === hoy.anio && (mes > hoy.mes || (mes === hoy.mes && dia > hoy.dia)));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold text-slate-500 sm:gap-2">
        {DIAS_SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: vacios }, (_, i) => (
          <li key={`vacio-${i}`} aria-hidden="true" />
        ))}
        {dias.map((dia) => {
          const datos = porDia.get(dia);
          const esHoy = anio === hoy.anio && mes === hoy.mes && dia === hoy.dia;
          const clase = cn(
            "flex aspect-square flex-col justify-between rounded-xl border p-1.5 text-left transition sm:aspect-auto sm:min-h-20 sm:p-2",
            datos ? "border-sky-100 bg-sky-50 hover:bg-sky-100" : "border-slate-100 bg-white",
            esHoy && "ring-2 ring-sky-500",
          );
          const contenido = (
            <>
              <span className={cn("text-xs font-semibold sm:text-sm", datos ? "text-slate-900" : "text-slate-400")}>{dia}</span>
              {datos && (
                <>
                  <span aria-hidden="true" className="mx-auto h-1.5 w-1.5 rounded-full bg-sky-600 sm:hidden" />
                  <span className="hidden text-xs font-bold text-sky-800 tabular-nums sm:block">{plataCorta(datos.total)}</span>
                </>
              )}
            </>
          );
          return (
            <li key={dia}>
              {futuro(dia) ? (
                <span className={cn(clase, "opacity-40")}>{contenido}</span>
              ) : (
                <Link
                  to={rutaDia(dia)}
                  aria-label={`${dia}: ${datos ? plata(datos.total) : "sin cobros"}${esHoy ? " (hoy)" : ""}`}
                  aria-current={esHoy ? "date" : undefined}
                  className={cn(clase, "outline-none focus-visible:ring-2 focus-visible:ring-sky-400")}
                >
                  {contenido}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
