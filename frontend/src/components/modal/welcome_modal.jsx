import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

/**
 * Bienvenida después del login. Sigue sola a los `delayMs` (la barra muestra cuánto falta) o con
 * "Continuar ahora". Corto a propósito: el staff lo ve en cada inicio de sesión.
 */
export default function WelcomeModal({ nombre, apellido, onFinish, delayMs = 3000 }) {
  const timerRef = useRef(null);
  const botonRef = useRef(null);

  useEffect(() => {
    botonRef.current?.focus();
    timerRef.current = setTimeout(onFinish, delayMs);
    return () => clearTimeout(timerRef.current);
  }, [onFinish, delayMs]);

  function continuarAhora() {
    clearTimeout(timerRef.current);
    onFinish();
  }

  const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl"
      >
        <div className="px-6 pt-8 pb-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
            <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-emerald-600" />
          </span>
          <h2 id="bienvenida-titulo" className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
            ¡Bienvenido al sistema!
          </h2>
          {nombreCompleto && <p className="mt-1 text-base font-medium text-slate-700">{nombreCompleto}</p>}
          <p className="mt-3 text-sm text-slate-500">Entrando al panel…</p>

          <button
            ref={botonRef}
            type="button"
            onClick={continuarAhora}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            Continuar ahora
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div aria-hidden="true" className="h-1 bg-slate-100">
          <div className="dg-progreso h-full bg-sky-500" style={{ animationDuration: `${delayMs}ms` }} />
        </div>
      </div>
    </div>
  );
}
