import { CheckCircle, IdCard, Banknote, Ticket, CalendarDays, CreditCard } from "lucide-react";
import { formatearFechaAR } from "../form/formatear_fecha";
import { useCuentaRegresiva } from "../../hook/use_cuenta_regresiva.js";

// El contenido se monta al abrir: así la cuenta regresiva arranca de nuevo cada vez.
export default function PagoSuccessModal({ open, ...props }) {
  return open ? <ContenidoPagoExitoso {...props} /> : null;
}

function ContenidoPagoExitoso({ alumno, plan, pago, delayMs = 6000, onFinish }) {
  const totalSeg = Math.round(delayMs / 1000);
  const restante = useCuentaRegresiva({ segundos: totalSeg, alTerminar: onFinish });

  const porcentaje = (restante / totalSeg) * 100;
  const nombre = [alumno?.nombre, alumno?.apellido].filter(Boolean).join(" ") ||
                 [alumno?.apellido, alumno?.nombre].filter(Boolean).join(" ");

  const METODO_LABELS = {
    EFECTIVO:      "Efectivo",
    TRANSFERENCIA: "Transferencia",
    "DÉBITO":      "Débito",
    "CRÉDITO":     "Crédito",
    "MERCADO PAGO":"Mercado Pago",
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12]/96 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
        .pm-d { font-family: 'Barlow Condensed', sans-serif; }

        @keyframes pm-check {
          from { transform: scale(0) rotate(-15deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes pm-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .pm-icon    { animation: pm-check .5s cubic-bezier(.34,1.56,.64,1) both; }
        .pm-content { animation: pm-up .5s .2s ease both; }
      `}</style>

      {/* Barra superior */}
      <div className="h-1.5 bg-linear-to-r from-emerald-700 via-emerald-400 to-emerald-700 shrink-0" />

      {/* Countdown bar */}
      <div className="h-1 bg-white/5 shrink-0">
        <div
          className="h-full bg-emerald-500/55 transition-[width] duration-1000 ease-linear"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">

        {/* Ícono */}
        <div className="pm-icon mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/12 ring-4 ring-emerald-500/25">
          <CheckCircle size={50} className="text-emerald-400" strokeWidth={1.5} />
        </div>

        {/* Título + nombre */}
        <div className="pm-content">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">
            ¡Pago registrado!
          </span>
          {nombre ? (
            <h2 className="pm-d mt-2 text-6xl md:text-7xl font-black uppercase text-white leading-[0.92]">
              {alumno?.apellido}
              <span className="block text-emerald-400">{alumno?.nombre}</span>
            </h2>
          ) : (
            <h2 className="pm-d mt-2 text-6xl font-black uppercase text-emerald-400">
              Pago OK
            </h2>
          )}
        </div>

        {/* Chips: DNI + monto */}
        <div className="pm-content mt-6 flex flex-wrap justify-center gap-3">
          {alumno?.documento && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <IdCard size={18} className="text-emerald-400" />
              DNI {alumno.documento}
            </div>
          )}
          {pago?.monto_pagado != null && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <Banknote size={18} className="text-emerald-400" />
              {Number(pago.monto_pagado).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </div>
          )}
        </div>

        {/* Card con detalles del plan y pago */}
        <div className="pm-content mt-6 w-full max-w-md rounded-2xl border border-white/15 bg-white/8 p-5 text-left space-y-4">

          {plan?.tipo_plan_descripcion && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/25">
                <Ticket size={22} className="text-sky-300" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Plan</div>
                <div className="text-xl font-bold text-white">{plan.tipo_plan_descripcion}</div>
              </div>
            </div>
          )}

          {(plan?.inicio || plan?.fin) && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/25">
                <CalendarDays size={22} className="text-amber-300" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Vigencia</div>
                <div className="text-xl font-bold text-white">
                  {plan.inicio ? formatearFechaAR(plan.inicio) : "—"}
                  {" → "}
                  {plan.fin ? formatearFechaAR(plan.fin) : "—"}
                </div>
              </div>
            </div>
          )}

          {plan?.ingresos_disponibles != null && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25">
                <span className="text-xl font-black text-emerald-300">{plan.ingresos_disponibles}</span>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Ingresos disponibles</div>
                <div className="text-xl font-bold text-emerald-300">
                  {plan.ingresos_disponibles} ingreso{plan.ingresos_disponibles !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          )}

          {pago?.metodo_pago && (
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/25">
                <CreditCard size={22} className="text-violet-300" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Método de pago</div>
                <div className="text-xl font-bold text-white">
                  {METODO_LABELS[pago.metodo_pago] ?? pago.metodo_pago}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={() => onFinish?.()}
          className="pm-content mt-7 rounded-2xl border border-white/20 bg-white/8 px-8 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
        >
          Continuar · {restante}s
        </button>

      </div>
    </div>
  );
}
