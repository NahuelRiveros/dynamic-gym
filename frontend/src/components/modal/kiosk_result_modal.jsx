import { CheckCircle, IdCard, Clock, Calendar, Ticket } from "lucide-react";
import { formatearFechaAR } from "../form/formatear_fecha";
import { useCuentaRegresiva } from "../../hook/use_cuenta_regresiva.js";

export default function KioskResultModal({ resp, onClose, autoCloseMs = 8000 }) {
  const totalSeg = Math.round(autoCloseMs / 1000);
  const restante = useCuentaRegresiva({ segundos: totalSeg, alTerminar: onClose });

  // Después de los hooks: React necesita que se llamen siempre los mismos, en el mismo orden.
  if (!resp) return null;

  const alumno = resp.alumno || {};
  const plan = resp.plan || null;
  const porcentaje = (restante / totalSeg) * 100;
  const pocosIngresos = plan?.ingresos_restantes != null && plan.ingresos_restantes <= 3;

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12]/96 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
        .rm-d { font-family: 'Barlow Condensed', sans-serif; }

        @keyframes rm-check {
          from { transform: scale(0) rotate(-15deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes rm-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .rm-icon    { animation: rm-check .5s cubic-bezier(.34,1.56,.64,1) both; }
        .rm-content { animation: rm-up .5s .18s ease both; }
      `}</style>

      {/* Barra superior verde */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-700 via-emerald-400 to-emerald-700 flex-shrink-0" />

      {/* Barra de countdown */}
      <div className="h-1 bg-white/5 flex-shrink-0">
        <div
          className="h-full bg-emerald-500/55 transition-[width] duration-1000 ease-linear"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center overflow-y-auto">

        {/* Ícono check */}
        <div className="rm-icon mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/12 ring-4 ring-emerald-500/25">
          <CheckCircle size={50} className="text-emerald-400" strokeWidth={1.5} />
        </div>

        {/* Nombre */}
        <div className="rm-content">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-400">
            ¡Bienvenido/a!
          </span>
          <h2 className="rm-d mt-2 text-6xl md:text-7xl font-black uppercase text-white leading-[0.92]">
            {alumno.nombre}
            <span className="block text-emerald-400">{alumno.apellido}</span>
          </h2>
        </div>

        {/* Chips: DNI + hora */}
        <div className="rm-content mt-6 flex flex-wrap justify-center gap-3">
          {alumno.documento && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <IdCard size={18} className="text-emerald-400" />
              DNI {alumno.documento}
            </div>
          )}
          {resp.hora_ingreso && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <Clock size={18} className="text-emerald-400" />
              {String(resp.hora_ingreso).slice(0, 5)}
            </div>
          )}
        </div>

        {/* Info del plan */}
        {plan && (
          <div className="rm-content mt-6 w-full max-w-md rounded-2xl border border-white/15 bg-white/8 p-5 text-left space-y-4">
            {plan.tipo_plan && (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/25">
                  <Ticket size={22} className="text-sky-300" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Plan</div>
                  <div className="text-xl font-bold text-white">{plan.tipo_plan}</div>
                </div>
              </div>
            )}

            {plan.fin && (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/25">
                  <Calendar size={22} className="text-amber-300" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Vigencia hasta</div>
                  <div className="text-xl font-bold text-white">{formatearFechaAR(plan.fin)}</div>
                </div>
              </div>
            )}

            {plan.ingresos_restantes != null && (
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${pocosIngresos ? "bg-rose-500/25" : "bg-emerald-500/25"}`}>
                  <span className={`text-xl font-black ${pocosIngresos ? "text-rose-300" : "text-emerald-300"}`}>
                    {plan.ingresos_restantes}
                  </span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">Ingresos restantes</div>
                  <div className={`text-xl font-bold ${pocosIngresos ? "text-rose-300" : "text-emerald-300"}`}>
                    {plan.ingresos_restantes === 0
                      ? "Sin ingresos disponibles"
                      : `${plan.ingresos_restantes} restante${plan.ingresos_restantes !== 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón cerrar con countdown */}
        <button
          onClick={onClose}
          className="rm-content mt-7 rounded-2xl border border-white/20 bg-white/8 px-8 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
        >
          Continuar · {restante}s
        </button>
      </div>
    </div>
  );
}
