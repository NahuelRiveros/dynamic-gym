import { useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCcw, Search } from "lucide-react";
import { images } from "../../assets/index.js";
import { usePlanPublico } from "../../hook/use_alumnos.js";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { conPuntos, soloNumeros } from "../../lib/dni.js";
import TarjetaPlan from "./tarjeta_plan.jsx";


/** "Mi Plan": el alumno escribe su DNI y ve su plan, sin iniciar sesión. */
export default function ConsultaPlanPage() {
  const [dni, setDni] = useState("");
  const [consultado, setConsultado] = useState("");
  const inputRef = useRef(null);
  const consulta = usePlanPublico(consultado);

  function buscar(e) {
    e.preventDefault();
    if (dni.length < 6) {
      inputRef.current?.focus();
      return;
    }
    if (dni === consultado) consulta.refetch();
    setConsultado(dni);
  }

  function otraConsulta() {
    setDni("");
    setConsultado("");
    inputRef.current?.focus();
  }

  const cargando = consulta.isFetching;
  const resultado = consultado && !cargando ? consulta.data : null;
  const error = consultado && !cargando && consulta.isError ? mensajeDeError(consulta.error, "No pudimos consultar tu plan. Probá de nuevo.") : null;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 pb-16">
      <section className="relative overflow-hidden bg-slate-950 px-4 pt-12 pb-28 text-center sm:pt-16">
        <img src={images.principal2} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-slate-950/70 via-slate-950/80 to-slate-950" />
        <div className="relative mx-auto max-w-md">
          <p className="text-xs font-semibold tracking-[0.2em] text-sky-400 uppercase">Mi Plan</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Consultá tu plan</h1>
          <p className="mt-3 text-slate-300">Escribí tu DNI y mirá cuántos días e ingresos te quedan.</p>
        </div>
      </section>

      <div className="relative mx-auto -mt-20 max-w-md space-y-4 px-4">
        <form onSubmit={buscar} className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/60 sm:p-6">
          <label htmlFor="dni" className="block text-sm font-semibold text-slate-700">
            Tu DNI
          </label>
          <input
            ref={inputRef}
            id="dni"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={conPuntos(dni)}
            onChange={(e) => setDni(soloNumeros(e.target.value))}
            placeholder="30.111.222"
            aria-describedby="dni-ayuda"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center text-2xl font-bold tracking-widest text-slate-900 tabular-nums transition outline-none placeholder:font-semibold placeholder:text-slate-300 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <p id="dni-ayuda" className="mt-2 text-center text-xs text-slate-500">
            No hace falta iniciar sesión.
          </p>
          <button
            type="submit"
            disabled={cargando || dni.length < 6}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-sm shadow-sky-600/25 transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Search aria-hidden="true" className="h-5 w-5" />}
            {cargando ? "Consultando…" : "Consultar"}
          </button>
        </form>

        <div aria-live="polite" className="space-y-4">
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-rose-800">
              <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-semibold">{error}</p>
                <p className="mt-0.5 text-sm">Revisá que el número esté bien escrito. Si sos nuevo, consultá en recepción.</p>
              </div>
            </div>
          )}

          {resultado && <TarjetaPlan alumno={resultado.alumno} plan={resultado.plan_actual} />}

          {(resultado || error) && (
            <button
              type="button"
              onClick={otraConsulta}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Consultar otro DNI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
