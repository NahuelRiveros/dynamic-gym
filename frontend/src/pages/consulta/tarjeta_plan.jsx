import { AlertTriangle, CalendarClock, CheckCircle2, Info, XCircle } from "lucide-react";
import { images } from "../../assets/index.js";
import { cn } from "../../lib/cn.js";
import { estadoDelPlan, fechaCorta, proporcionRestante } from "./estado_plan.js";

const TONOS = {
  ok:      { icono: CheckCircle2,  caja: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: "text-emerald-600", barra: "bg-emerald-400" },
  aviso:   { icono: CalendarClock, caja: "border-amber-200 bg-amber-50 text-amber-800",       icon: "text-amber-600",   barra: "bg-amber-400" },
  alerta:  { icono: AlertTriangle, caja: "border-orange-200 bg-orange-50 text-orange-800",    icon: "text-orange-600",  barra: "bg-orange-400" },
  vencido: { icono: XCircle,       caja: "border-rose-200 bg-rose-50 text-rose-800",          icon: "text-rose-600",    barra: "bg-rose-400" },
  neutro:  { icono: Info,          caja: "border-slate-200 bg-slate-50 text-slate-700",       icon: "text-slate-500",   barra: "bg-slate-400" },
};

function Dato({ etiqueta, valor, detalle }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs font-medium text-sky-200/80">{etiqueta}</p>
      <p className="mt-0.5 text-3xl leading-none font-extrabold text-white tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-300">{detalle}</p>}
    </div>
  );
}

/** El "pase" del alumno: quién es, su plan, cuánto le queda y qué tiene que hacer. */
export default function TarjetaPlan({ alumno, plan = null }) {
  const estado = estadoDelPlan(plan);
  const tono = TONOS[estado.tono];
  const IconoEstado = tono.icono;
  const dias = Math.max(0, Number(plan?.dias_restantes ?? 0));
  const restante = proporcionRestante(plan);

  return (
    <div className="space-y-3">
      <article className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-sky-900 p-6 text-white shadow-xl shadow-slate-900/20">
        <div aria-hidden="true" className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={images.dynamicLogo} alt="" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-sm font-bold">
              Dynamic <span className="text-sky-400">Gym</span>
            </span>
          </div>
          {alumno.estado_desc && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/15">{alumno.estado_desc}</span>
          )}
        </div>

        <div className="relative mt-6">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {alumno.nombre} {alumno.apellido}
          </h2>
          <p className="mt-0.5 text-sm text-slate-300">DNI {Number(alumno.documento).toLocaleString("es-AR")}</p>
        </div>

        {plan && (
          <div className="relative mt-6">
            <p className="text-xs font-semibold tracking-wider text-sky-300 uppercase">Tu plan</p>
            <p className="mt-0.5 text-lg font-bold">{plan.tipoplan_desc || "—"}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Dato etiqueta="Días que te quedan" valor={plan.vigente_hoy ? dias : 0} />
              {/* Con el plan vencido, los ingresos que sobraron no sirven: no se muestran como disponibles. */}
              <Dato
                etiqueta="Ingresos disponibles"
                valor={!plan.vigente_hoy ? "—" : plan.ingresos_ilimitados ? "Libre" : (plan.ingresos_disponibles ?? 0)}
                detalle={plan.vigente_hoy && plan.ingresos_ilimitados ? "Entrás cuando quieras" : null}
              />
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Desde {fechaCorta(plan.inicio)}</span>
                <span>Vence {fechaCorta(plan.fin)}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Tiempo que le queda al plan"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(restante * 100)}
                className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div className={cn("h-full rounded-full transition-[width] duration-700", tono.barra)} style={{ width: `${restante * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </article>

      <div role="status" className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5", tono.caja)}>
        <IconoEstado aria-hidden="true" className={cn("mt-0.5 h-5 w-5 shrink-0", tono.icon)} />
        <div>
          <p className="font-semibold">{estado.titulo}</p>
          <p className="mt-0.5 text-sm opacity-90">{estado.detalle}</p>
        </div>
      </div>
    </div>
  );
}
