import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn.js";

const ANCHOS = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl", "2xl": "max-w-2xl", "3xl": "max-w-3xl" };

/**
 * Ventana modal del panel (traída de Stilos): <dialog> nativo, así el foco queda adentro, Escape
 * cierra y al cerrar el foco vuelve al botón que la abrió. Con `ocupado` (guardando) no se cierra.
 * Los hijos se desmontan al cerrar: un formulario adentro arranca de cero cada vez que se abre.
 */
export default function Modal({ abierto = true, onCerrar, titulo, descripcion, ocupado = false, ancho = "lg", children }) {
  const ref = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!abierto || !dialogo) return;
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialogo.close();
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  // Portal + stopPropagation: un modal abierto desde un formulario no queda como <form> adentro de
  // otro, y guardarlo no envía también el de afuera.
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onSubmit={(e) => e.stopPropagation()}
      onCancel={(e) => {
        e.preventDefault();
        if (!ocupado) onCerrar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !ocupado) onCerrar();
      }}
      className={cn(
        "m-auto max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50",
        ANCHOS[ancho] ?? ANCHOS.lg,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <h2 id={idTitulo} className="text-xl font-bold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-slate-600">{descripcion}</p>}
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          disabled={ocupado}
          onClick={onCerrar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>,
    document.body,
  );
}
