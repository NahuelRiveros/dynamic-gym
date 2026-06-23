import { useEffect, useState } from "react";
import { XCircle, RefreshCw } from "lucide-react";

const MENSAJES = {
  NO_EXISTE: {
    titulo: "DNI no registrado",
    desc: "Este documento no existe en el sistema. Consultá en recepción para registrarte.",
  },
  NO_ES_ALUMNO: {
    titulo: "No sos alumno",
    desc: "La persona existe pero no está registrada como alumno del gym.",
  },
  PLAN_VENCIDO_O_INEXISTENTE: {
    titulo: "Plan vencido",
    desc: "No tenés un plan activo. Dirigite a recepción para renovar tu membresía.",
  },
  SIN_INGRESOS: {
    titulo: "Sin ingresos disponibles",
    desc: "Agotaste los ingresos de tu plan actual. Renovalo en recepción para seguir entrenando.",
  },
  RESTRINGIDO: {
    titulo: "Acceso restringido",
    desc: "Tu acceso está restringido. Consultá en recepción.",
  },
  VALIDACION: {
    titulo: "DNI inválido",
    desc: "Ingresá un número de DNI válido (sin puntos ni espacios).",
  },
  YA_INGRESO_HOY: {
    titulo: "Ya ingresaste hoy",
    desc: "Tu ingreso ya fue registrado para el día de hoy.",
  },
  // Errores técnicos — el cliente no necesita ver el detalle real
  NO_AUTH:        { titulo: "Sistema no disponible", desc: "Consultá con el desarrollador." },
  TOKEN_INVALIDO: { titulo: "Sistema no disponible", desc: "Consultá con el desarrollador." },
  SIN_PERMISO:    { titulo: "Sistema no disponible", desc: "Consultá con el desarrollador." },
  ERROR:          { titulo: "Error del sistema",     desc: "No se pudo registrar el ingreso. Intentá de nuevo o consultá con el desarrollador." },
};

export default function KioskErrorModal({ resp, onClose, autoCloseMs = 6000 }) {
  if (!resp) return null;

  const codigo = resp.codigo || "ERROR";
  const totalSeg = Math.round(autoCloseMs / 1000);
  const [restante, setRestante] = useState(totalSeg);

  useEffect(() => {
    let seg = totalSeg;
    const t = setInterval(() => {
      seg -= 1;
      if (seg <= 0) {
        clearInterval(t);
        onClose();
      } else {
        setRestante(seg);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const porcentaje = (restante / totalSeg) * 100;
  const { titulo, desc } = MENSAJES[codigo] ?? {
    titulo: "Acceso denegado",
    desc: "No se pudo registrar el ingreso. Consultá con el desarrollador.",
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#060a12]/96 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&display=swap');
        .em-d { font-family: 'Barlow Condensed', sans-serif; }

        @keyframes em-shake {
          0%,100% { transform: translateX(0);  }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px);  }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px);  }
        }
        @keyframes em-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .em-icon    { animation: em-shake .55s .1s ease both; }
        .em-content { animation: em-up    .5s .2s ease both;  }
      `}</style>

      {/* Barra superior roja */}
      <div className="h-1.5 bg-linear-to-r from-rose-800 via-rose-500 to-rose-800 shrink-0" />

      {/* Countdown bar */}
      <div className="h-1 bg-white/5 shrink-0">
        <div
          className="h-full bg-rose-500/55 transition-[width] duration-1000 ease-linear"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">

        {/* Ícono error */}
        <div className="em-icon mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/12 ring-4 ring-rose-500/25">
          <XCircle size={50} className="text-rose-400" strokeWidth={1.5} />
        </div>

        {/* Título + descripción */}
        <div className="em-content">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-400">
            Acceso denegado
          </span>
          <h2 className="em-d mt-2 text-5xl md:text-6xl font-black uppercase text-white leading-tight">
            {titulo}
          </h2>
          <p className="mt-4 max-w-sm mx-auto text-base font-medium text-white leading-relaxed">
            {desc}
          </p>
        </div>

        {/* Hint recepción */}
        <div className="em-content mt-8 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
          <RefreshCw size={15} className="text-rose-400" />
          Dirigite a recepción para más información
        </div>

        {/* Botón cerrar con countdown */}
        <button
          onClick={onClose}
          className="em-content mt-5 rounded-2xl border border-white/20 bg-white/8 px-8 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-all"
        >
          Intentar de nuevo · {restante}s
        </button>
      </div>
    </div>
  );
}
