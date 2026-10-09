import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useRecaudacionMensual } from "../../hook/use_recaudacion.js";
import { cn } from "../../lib/cn.js";
import DatoResumen from "./dato_resumen.jsx";
import { COLOR, MESES, hoyAR, plata, variacion } from "./formato.js";
import GraficoAnual from "./grafico_anual.jsx";
import SelectorPeriodo from "./selector_periodo.jsx";

const sumar = (meses, campo) => meses.reduce((acc, m) => acc + m[campo], 0);

/** Recaudación del año: total, planes / productos, comparación con el año anterior y un mes por barra. */
export default function RecaudacionAnualPage() {
  const nav = useNavigate();
  const hoy = hoyAR();
  // El año va en la dirección (?anio=2025): al volver desde un mes se sigue viendo el mismo año.
  const [params, setParams] = useSearchParams();
  const elegido = Number(params.get("anio"));
  const anio = Number.isInteger(elegido) && elegido >= 2000 && elegido <= hoy.anio ? elegido : hoy.anio;
  const irAnio = (nuevo) => setParams(nuevo === hoy.anio ? {} : { anio: String(nuevo) }, { replace: true });
  // Los años ya vistos quedan en caché: ir y volver no vuelve a consultar.
  const consulta = useRecaudacionMensual(anio);
  const anterior = useRecaudacionMensual(anio - 1);

  const meses = consulta.data?.items ?? [];
  const esteAnio = anio === hoy.anio;
  // El año en curso se compara contra los mismos meses del anterior (no contra el año completo).
  const hastaMes = esteAnio ? hoy.mes : 12;
  const total = sumar(meses, "total");
  const totalAnterior = sumar((anterior.data?.items ?? []).filter((m) => m.mes <= hastaMes), "total");
  const cambio = anterior.isSuccess ? variacion(sumar(meses.filter((m) => m.mes <= hastaMes), "total"), totalAnterior) : null;
  const mejor = meses.reduce((max, m) => (m.total > (max?.total ?? 0) ? m : max), null);
  const rutaMes = (mes) => `/estadisticas/recaudaciones/${anio}/${mes}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <SelectorPeriodo
        titulo={`Recaudación ${anio}`}
        etiqueta="Año"
        onAnterior={() => irAnio(anio - 1)}
        onSiguiente={() => irAnio(anio + 1)}
        sinSiguiente={esteAnio}
      />

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      {consulta.isPending ? (
        <div aria-label="Cargando recaudación" className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        consulta.isSuccess && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DatoResumen
                destacado
                etiqueta={`Total ${anio}`}
                valor={plata(total)}
                detalle={cambio === null ? null : `${cambio >= 0 ? "+" : ""}${cambio}% vs. ${esteAnio ? "mismo período de " : ""}${anio - 1}`}
              />
              <DatoResumen etiqueta="Planes" color={COLOR.planes} valor={plata(sumar(meses, "planes"))} />
              <DatoResumen etiqueta="Productos" color={COLOR.productos} valor={plata(sumar(meses, "productos"))} />
              <DatoResumen etiqueta="Mejor mes" valor={mejor ? MESES[mejor.mes - 1] : "—"} detalle={mejor ? plata(mejor.total) : null} />
            </div>

            {total === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-slate-500">
                No hay cobros registrados en {anio}.
              </p>
            ) : (
              <GraficoAnual meses={meses} mesActual={esteAnio ? hoy.mes : null} onElegirMes={(mes) => nav(rutaMes(mes))} />
            )}

            <section aria-labelledby="titulo-meses" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <h2 id="titulo-meses" className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 sm:px-5">
                Mes por mes
              </h2>
              <ul className="divide-y divide-slate-100">
                {meses.map((m) => {
                  const futuro = esteAnio && m.mes > hoy.mes;
                  return (
                    <li key={m.mes}>
                      <Link
                        to={rutaMes(m.mes)}
                        className={cn("flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5", futuro && "pointer-events-none opacity-50")}
                        aria-disabled={futuro || undefined}
                        tabIndex={futuro ? -1 : undefined}
                      >
                        <span className={cn("w-28 font-medium text-slate-800", esteAnio && m.mes === hoy.mes && "font-bold text-slate-900")}>
                          {MESES[m.mes - 1]}
                        </span>
                        <span className="hidden flex-1 text-xs text-slate-500 sm:block">
                          {m.total > 0 ? `Planes ${plata(m.planes)} · Productos ${plata(m.productos)}` : ""}
                        </span>
                        <span className="ml-auto font-semibold text-slate-900 tabular-nums">{m.total > 0 ? plata(m.total) : "—"}</span>
                        <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-300" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )
      )}
    </div>
  );
}
