import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import EstadoError from "../../components/ui/estado_error.jsx";
import { useRecaudacionDiaria } from "../../hook/use_recaudacion.js";
import CalendarioMes from "./calendario_mes.jsx";
import DatoResumen from "./dato_resumen.jsx";
import DesgloseMetodos from "./desglose_metodos.jsx";
import { COLOR, MESES, hoyAR, plata } from "./formato.js";
import SelectorPeriodo from "./selector_periodo.jsx";

const sumar = (items, campo) => items.reduce((acc, it) => acc + it[campo], 0);

/** Recaudación de un mes: totales, por método de pago y el calendario con cada día. */
export default function RecaudacionMesPage() {
  const { anio: anioTexto, mes: mesTexto } = useParams();
  const nav = useNavigate();
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const hoy = hoyAR();

  // Sin año o mes válidos en la dirección no se consulta (enabled: false).
  const consulta = useRecaudacionDiaria(anio, mes);
  const items = consulta.data?.items ?? [];
  const porDia = new Map(items.map((it) => [Number(it.dia.slice(8, 10)), it]));
  const total = sumar(items, "total");
  const promedio = items.length ? Math.round(total / items.length) : 0;

  const irMes = (delta) => {
    const fecha = new Date(Date.UTC(anio, mes - 1 + delta, 1));
    nav(`/estadisticas/recaudaciones/${fecha.getUTCFullYear()}/${fecha.getUTCMonth() + 1}`);
  };
  const rutaDia = (dia) => `/estadisticas/recaudaciones/${anio}/${mes}/${dia}/detalle`;
  const volverAnio = anio === hoy.anio ? "/estadisticas/recaudaciones-mensual" : `/estadisticas/recaudaciones-mensual?anio=${anio}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
      <SelectorPeriodo
        titulo={`${MESES[mes - 1] ?? "Mes"} ${anio}`}
        volver={{ ruta: volverAnio, texto: `Año ${anio}` }}
        etiqueta="Mes"
        onAnterior={() => irMes(-1)}
        onSiguiente={() => irMes(1)}
        sinSiguiente={anio > hoy.anio || (anio === hoy.anio && mes >= hoy.mes)}
      />

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      {consulta.isPending ? (
        <div aria-label="Cargando recaudación del mes" className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        consulta.isSuccess && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <DatoResumen destacado etiqueta="Total del mes" valor={plata(total)} detalle={`${items.length} ${items.length === 1 ? "día" : "días"} con cobros`} />
              <DatoResumen etiqueta="Planes" color={COLOR.planes} valor={plata(sumar(items, "planes"))} />
              <DatoResumen etiqueta="Productos" color={COLOR.productos} valor={plata(sumar(items, "productos"))} />
              <DatoResumen etiqueta="Promedio por día" valor={promedio ? plata(promedio) : "—"} detalle="De los días con cobros" />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <CalendarioMes anio={anio} mes={mes} porDia={porDia} hoy={hoy} rutaDia={rutaDia} />
              </div>
              <div className="space-y-5">
                <DesgloseMetodos metodos={consulta.data.metodos ?? []} titulo="Por método de pago (mes)" />

                {/* En el celular el calendario es chico: la lista dice cuánto entró cada día. */}
                <section aria-labelledby="titulo-dias" className="overflow-hidden rounded-2xl border border-slate-200 bg-white sm:hidden">
                  <h2 id="titulo-dias" className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                    Días con cobros
                  </h2>
                  {items.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">No hubo cobros este mes.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {items.map((it) => {
                        const dia = Number(it.dia.slice(8, 10));
                        return (
                          <li key={it.dia}>
                            <Link to={rutaDia(dia)} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                              <span className="font-medium text-slate-800">{dia} de {MESES[mes - 1].toLowerCase()}</span>
                              <span className="ml-auto font-semibold text-slate-900 tabular-nums">{plata(it.total)}</span>
                              <ChevronRight aria-hidden="true" className="h-4 w-4 text-slate-300" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
