import { AlertTriangle, CheckCircle2, Clock, Lock, MessageCircle } from "lucide-react";
import BotonCopiar from "../../components/ui/boton_copiar.jsx";
import EstadoError from "../../components/ui/estado_error.jsx";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { SOPORTE } from "../../config/soporte.js";
import { useEstadoSuscripcion } from "../../hook/use_suscripcion.js";
import { cn } from "../../lib/cn.js";
import { plata } from "../../lib/dinero.js";

const ESTADOS = {
  activo: { texto: "Al día", icono: CheckCircle2, clase: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  aviso: { texto: "Por vencer", icono: AlertTriangle, clase: "border-amber-200 bg-amber-50 text-amber-800" },
  gracia: { texto: "Período de gracia", icono: Clock, clase: "border-orange-200 bg-orange-50 text-orange-800" },
  vencido: { texto: "Vencido", icono: Lock, clase: "border-rose-200 bg-rose-50 text-rose-800" },
};

const fecha = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) : "—");
const dias = (n) => `${n} ${n === 1 ? "día" : "días"}`;

/** La frase principal según el estado: cuándo vence y cuánto falta (o cuánto queda de gracia). */
function resumen(e) {
  if (e.estado === "gracia") return `Venció el ${fecha(e.fecha_vencimiento)}. Te ${e.dias_gracia_restantes === 1 ? "queda" : "quedan"} ${dias(e.dias_gracia_restantes)} de gracia para pagar.`;
  if (e.estado === "vencido") return `Venció el ${fecha(e.fecha_vencimiento)}. Pagá para seguir usando el sistema.`;
  return `Vence el ${fecha(e.fecha_vencimiento)} · ${e.dias_restantes === 1 ? "falta" : "faltan"} ${dias(e.dias_restantes)}.`;
}

function Paso({ numero, titulo, children }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {numero}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{titulo}</p>
        <div className="mt-1 text-sm text-slate-600">{children}</div>
      </div>
    </li>
  );
}

/** Suscripción del sistema para el admin del gimnasio: estado, cómo pagar y cómo funciona el ciclo. */
export default function SuscripcionPage() {
  const consulta = useEstadoSuscripcion();
  const e = consulta.data;

  if (consulta.isPending) return <div aria-label="Cargando la suscripción" className="mx-auto mt-6 h-96 max-w-2xl animate-pulse rounded-2xl bg-slate-100" />;

  const ui = ESTADOS[e?.estado];
  const Icono = ui?.icono;
  const mes = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" });
  const mensajeWhatsapp = encodeURIComponent(
    `Hola ${SOPORTE.nombre}! Te mando el comprobante del pago mensual del sistema.\n\n` +
      `Gimnasio: ${e?.cliente_nombre ?? ""}\nMonto: ${plata(e?.precio)}\nPeríodo: ${mes}\n\nAdjunto el comprobante.`,
  );
  const ciclo = e?.ok
    ? [
        { clave: "activo", texto: `Al día: hasta ${e.dias_aviso} días antes del vencimiento.` },
        { clave: "aviso", texto: `Por vencer: los últimos ${e.dias_aviso} días. Es el momento de pagar.` },
        { clave: "gracia", texto: `Gracia: hasta ${dias(e.dias_gracia)} después del vencimiento, todo sigue funcionando.` },
        { clave: "vencido", texto: "Vencido: pasada la gracia, hay que pagar para seguir usando el sistema." },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Suscripción</h1>
        <p className="mt-1 text-sm text-slate-500">El sistema Dynamic Gym se paga por mes.</p>
      </div>

      {consulta.isError && <EstadoError error={consulta.error} onReintentar={() => consulta.refetch()} reintentando={consulta.isFetching} />}

      {e && !e.ok && (
        <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
          {e.mensaje ?? "No hay suscripción configurada."} Escribile a {SOPORTE.nombre} para activarla.
        </div>
      )}

      {e?.ok && ui && (
        <>
          <section aria-labelledby="titulo-estado" className={cn("rounded-2xl border p-5", ui.clase)}>
            <h2 id="titulo-estado" className="flex items-center gap-2 text-sm font-bold">
              <Icono aria-hidden="true" className="h-5 w-5" />
              {ui.texto}
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-900">{resumen(e)}</p>
            <p className="mt-1 text-sm text-slate-700">
              {e.plan_nombre || "Plan mensual"} · <strong>{plata(e.precio)}</strong> por mes{e.cliente_nombre ? ` · ${e.cliente_nombre}` : ""}
            </p>
          </section>

          <section aria-labelledby="titulo-pago" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="titulo-pago" className="text-sm font-semibold text-slate-500">
              Cómo pagar
            </h2>
            <ol className="mt-4 space-y-5">
              <Paso numero={1} titulo="Transferí el monto al alias">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-2">
                    Alias <strong className="font-mono text-base text-slate-900">{SOPORTE.aliasTransferencia}</strong>
                    <BotonCopiar texto={SOPORTE.aliasTransferencia} etiqueta="alias" />
                  </span>
                  <span className="flex items-center gap-2">
                    Monto <strong className="text-base text-slate-900 tabular-nums">{plata(e.precio)}</strong>
                    <BotonCopiar texto={e.precio} etiqueta="monto" />
                  </span>
                </div>
              </Paso>
              <Paso numero={2} titulo="Mandá el comprobante por WhatsApp">
                El mensaje ya va armado con el gimnasio, el monto y el mes: solo adjuntá la captura.
                <a
                  href={`https://wa.me/${SOPORTE.whatsapp}?text=${mensajeWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-5 py-3 font-semibold text-white transition hover:bg-[#188f47]"
                >
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                  Enviar comprobante por WhatsApp
                </a>
              </Paso>
              <Paso numero={3} titulo={`${SOPORTE.nombre} renueva el mes`}>
                Dentro de las 24 h hábiles de recibido el comprobante. El vencimiento nuevo aparece acá.
              </Paso>
            </ol>
          </section>

          <section aria-labelledby="titulo-ciclo" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="titulo-ciclo" className="text-sm font-semibold text-slate-500">
              Cómo funciona el vencimiento
            </h2>
            <ul className="mt-3 space-y-2">
              {ciclo.map(({ clave, texto }) => {
                const actual = clave === e.estado;
                const IconoEtapa = ESTADOS[clave].icono;
                return (
                  <li key={clave} aria-current={actual ? "step" : undefined} className={cn("flex items-start gap-2 rounded-xl px-3 py-2 text-sm", actual ? ESTADOS[clave].clase + " border font-semibold" : "text-slate-600")}>
                    <IconoEtapa aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {texto}
                      {actual && " (estás acá)"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
