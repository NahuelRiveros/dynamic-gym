import { useState } from "react";
import { X, Trash2, Copy, Check, AlertCircle, ShieldOff, WifiOff } from "lucide-react";

export const KIOSK_LOG_KEY = "kiosk_log";
const LOG_MAX = 200;

export function guardarLogKiosk({ dni, codigo, mensaje }) {
  try {
    const log = JSON.parse(localStorage.getItem(KIOSK_LOG_KEY) || "[]");
    log.unshift({
      ts: new Date().toISOString(),
      dni,
      codigo,
      mensaje,
    });
    if (log.length > LOG_MAX) log.splice(LOG_MAX);
    localStorage.setItem(KIOSK_LOG_KEY, JSON.stringify(log));
  } catch {}
}

function fmt(ts) {
  try {
    return new Date(ts).toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });
  } catch { return ts; }
}

const CODIGO_UI = {
  NO_AUTH:       { color: "text-red-400 border-red-800/50 bg-red-900/20",    icon: ShieldOff },
  TOKEN_INVALIDO:{ color: "text-red-400 border-red-800/50 bg-red-900/20",    icon: ShieldOff },
  SIN_PERMISO:   { color: "text-orange-400 border-orange-800/50 bg-orange-900/20", icon: ShieldOff },
  ALUMNO_NO_ENCONTRADO: { color: "text-yellow-400 border-yellow-800/50 bg-yellow-900/20", icon: AlertCircle },
  INACTIVO:      { color: "text-yellow-400 border-yellow-800/50 bg-yellow-900/20", icon: AlertCircle },
  ERROR:         { color: "text-slate-400 border-slate-700 bg-slate-800/40",  icon: WifiOff },
};

function getUi(codigo) {
  return CODIGO_UI[codigo] ?? CODIGO_UI.ERROR;
}

export default function KioskLogModal({ onClose }) {
  const [copiado, setCopiado] = useState(false);
  const log = JSON.parse(localStorage.getItem(KIOSK_LOG_KEY) || "[]");

  function limpiar() {
    localStorage.removeItem(KIOSK_LOG_KEY);
    onClose();
  }

  function copiar() {
    const texto = log
      .map((e) => `[${fmt(e.ts)}] DNI:${e.dni} | ${e.codigo} | ${e.mensaje}`)
      .join("\n");
    navigator.clipboard.writeText(texto).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Log de errores — Kiosk</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {log.length === 0 ? "Sin errores registrados" : `${log.length} entrada${log.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copiar}
              className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              {copiado ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <button
              onClick={limpiar}
              className="flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition"
            >
              <Trash2 size={12} />
              Limpiar
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Log list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {log.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-600 text-sm">
              No hay errores registrados
            </div>
          ) : (
            log.map((entry, i) => {
              const ui = getUi(entry.codigo);
              const Icono = ui.icon;
              return (
                <div
                  key={i}
                  className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${ui.color}`}
                >
                  <Icono size={15} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-mono font-bold">{entry.codigo}</span>
                      {entry.dni && (
                        <span className="text-xs text-slate-400">DNI {entry.dni}</span>
                      )}
                      <span className="text-xs text-slate-600 ml-auto">{fmt(entry.ts)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 break-words">{entry.mensaje}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
