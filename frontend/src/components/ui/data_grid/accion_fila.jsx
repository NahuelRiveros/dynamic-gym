const VARIANTES = {
  primary: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  danger:  "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  default: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
};

const evaluar = (valor, fila) => (typeof valor === "function" ? valor(fila) : valor);

/** Botón de una acción de fila ({ label, icon, variant, onClick, show, disabled }); siempre con texto. */
export default function AccionFila({ accion, fila }) {
  if (evaluar(accion.show, fila) === false) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation(); // no dispara el click de la fila
        accion.onClick?.(fila);
      }}
      disabled={!!evaluar(accion.disabled, fila)}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTES[accion.variant] ?? VARIANTES.default} ${accion.className ?? ""}`}
    >
      {accion.icon && <span className="shrink-0" aria-hidden="true">{accion.icon}</span>}
      <span>{accion.label}</span>
    </button>
  );
}
