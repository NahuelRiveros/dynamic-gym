import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CreditCard, Loader2, Search, UserPlus } from "lucide-react";
import FormError from "../../components/form/form_error.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { usePreviewPago, useRegistrarPago } from "../../hook/use_pagos.js";
import { usePlanes } from "../../hook/use_planes.js";
import { plata } from "../../lib/dinero.js";
import { conPuntos, soloNumeros } from "../../lib/dni.js";
import { vencimientoDesdeHoy } from "../../lib/fecha_ar.js";
import ResultadoCobro from "./resultado_cobro.jsx";
import SelectorMetodo from "./selector_metodo.jsx";
import SelectorPlan from "./selector_plan.jsx";
import TarjetaAlumnoCobro from "./tarjeta_alumno_cobro.jsx";

const TARJETA = "rounded-2xl border border-slate-200 bg-white p-5";

/** Cobrar un plan: buscar al alumno por DNI, elegir plan y método, y cobrar. El plan empieza hoy. */
export default function RegistrarPagoPage() {
  // Desde la ficha o la lista se llega con ?dni=: el alumno ya aparece buscado.
  const [params] = useSearchParams();
  const dniInicial = soloNumeros(params.get("dni"));
  const [dni, setDni] = useState(dniInicial);
  const [consultado, setConsultado] = useState(dniInicial);
  const [planId, setPlanId] = useState(null);
  const [metodo, setMetodo] = useState("EFECTIVO");

  const preview = usePreviewPago(consultado);
  const cobrar = useRegistrarPago();
  const planes = (usePlanes().data ?? []).filter((p) => p.activo);
  const plan = planes.find((p) => p.id === planId) ?? null;

  const alumno = preview.data?.alumno;
  const noExiste = preview.error?.response?.data?.codigo === "NO_EXISTE";

  function buscar(e) {
    e.preventDefault();
    if (dni.length < 6) return;
    if (dni === consultado) preview.refetch();
    setConsultado(dni);
  }

  function empezarDeNuevo() {
    cobrar.reset();
    setDni("");
    setConsultado("");
    setPlanId(null);
    setMetodo("EFECTIVO");
  }

  function confirmar(e) {
    e.preventDefault();
    if (!plan) return;
    cobrar.mutate({ documento: consultado, tipo_plan_id: plan.id, monto_pagado: Number(plan.precio), metodo_pago: metodo });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Cobrar plan</h1>
        <p className="mt-1 text-sm text-slate-500">Buscá al alumno, elegí el plan y cómo paga. El plan empieza hoy.</p>
      </div>

      {cobrar.isSuccess ? (
        <ResultadoCobro resultado={cobrar.data} onOtro={empezarDeNuevo} />
      ) : alumno && consultado ? (
        <>
          <TarjetaAlumnoCobro alumno={alumno} ultimoPago={preview.data.ultimo_pago} onCambiar={empezarDeNuevo} />

          <form onSubmit={confirmar} className={`${TARJETA} space-y-6`}>
            <SelectorPlan planes={planes} elegido={planId} onElegir={setPlanId} />
            <SelectorMetodo elegido={metodo} onElegir={setMetodo} />

            <div className="border-t border-slate-100 pt-5">
              {plan && (
                <p className="mb-3 text-sm text-slate-600">
                  {plan.descripcion}: de hoy al <strong>{formatearFechaAR(vencimientoDesdeHoy(plan.dias_totales))}</strong>.
                </p>
              )}
              <FormError message={cobrar.isError ? mensajeDeError(cobrar.error, "No se pudo registrar el pago") : null} />
              <button
                type="submit"
                disabled={!plan || cobrar.isPending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-sm transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cobrar.isPending ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <CreditCard aria-hidden="true" className="h-5 w-5" />}
                {cobrar.isPending ? "Cobrando…" : plan ? `Cobrar ${plata(plan.precio)}` : "Elegí un plan"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <form onSubmit={buscar} className={TARJETA}>
          <label htmlFor="dni-cobro" className="block text-sm font-semibold text-slate-900">
            DNI del alumno
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="dni-cobro"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={conPuntos(dni)}
              onChange={(e) => setDni(soloNumeros(e.target.value))}
              placeholder="30.111.222"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold tracking-wider text-slate-900 tabular-nums outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
            <button
              type="submit"
              disabled={dni.length < 6 || preview.isFetching}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 font-semibold text-white transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
            >
              {preview.isFetching ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Search aria-hidden="true" className="h-5 w-5" />}
              Buscar
            </button>
          </div>

          {preview.isError && (
            <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">{mensajeDeError(preview.error, "No se pudo buscar al alumno")}</p>
              {noExiste && (
                <Link to={`/register?dni=${consultado}`} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-sky-700 hover:underline">
                  <UserPlus aria-hidden="true" className="h-4 w-4" />
                  Darlo de alta como alumno nuevo
                </Link>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
