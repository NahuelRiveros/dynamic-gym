import { CheckCircle, UserPlus, IdCard, Hash } from "lucide-react";
import { useCuentaRegresiva } from "../../hook/use_cuenta_regresiva.js";

// El contenido se monta al abrir: así la cuenta regresiva arranca de nuevo cada vez.
export default function RegisterSuccessModal({ open, ...props }) {
  return open ? <ContenidoAltaExitosa {...props} /> : null;
}

function ContenidoAltaExitosa({ persona, alumno, delayMs = 5000, onFinish }) {
  const totalSeg = Math.round(delayMs / 1000);
  const restante = useCuentaRegresiva({ segundos: totalSeg, alTerminar: onFinish });

  const porcentaje = (restante / totalSeg) * 100;
  const nombre = [persona?.nombre, persona?.apellido].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12]/96 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
        .rs-d { font-family: 'Barlow Condensed', sans-serif; }

        @keyframes rs-check {
          from { transform: scale(0) rotate(-15deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes rs-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .rs-icon    { animation: rs-check .5s cubic-bezier(.34,1.56,.64,1) both; }
        .rs-content { animation: rs-up .5s .2s ease both; }
      `}</style>

      {/* Barra superior */}
      <div className="h-1.5 bg-linear-to-r from-sky-700 via-sky-400 to-sky-700 shrink-0" />

      {/* Countdown bar */}
      <div className="h-1 bg-white/5 shrink-0">
        <div
          className="h-full bg-sky-500/55 transition-[width] duration-1000 ease-linear"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">

        {/* Ícono */}
        <div className="rs-icon mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-sky-500/12 ring-4 ring-sky-500/25">
          <CheckCircle size={50} className="text-sky-400" strokeWidth={1.5} />
        </div>

        {/* Título */}
        <div className="rs-content">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-400">
            ¡Registro exitoso!
          </span>
          <h2 className="rs-d mt-2 text-6xl md:text-7xl font-black uppercase text-white leading-[0.92]">
            {nombre ? (
              <>
                {persona.nombre}
                <span className="block text-sky-400">{persona.apellido}</span>
              </>
            ) : (
              <span className="text-sky-400">Alumno registrado</span>
            )}
          </h2>
        </div>

        {/* Chips de datos */}
        <div className="rs-content mt-6 flex flex-wrap justify-center gap-3">
          {persona?.documento && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <IdCard size={18} className="text-sky-400" />
              DNI {persona.documento}
            </div>
          )}
          {alumno?.alumno_id && (
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-base font-bold text-white">
              <Hash size={18} className="text-sky-400" />
              ID {alumno.alumno_id}
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="rs-content mt-6 w-full max-w-sm rounded-2xl border border-white/15 bg-white/8 p-5 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/25">
              <UserPlus size={22} className="text-sky-300" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-0.5">
                Estado del alumno
              </div>
              <div className="text-xl font-bold text-white">Activo en el sistema</div>
            </div>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={() => onFinish?.()}
          className="rs-content mt-7 rounded-2xl border border-white/20 bg-white/8 px-8 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
        >
          Continuar · {restante}s
        </button>

      </div>
    </div>
  );
}
