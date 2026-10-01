import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn.js";
import Modal from "./modal.jsx";

const ESTILOS = {
  danger:  { icono: "border-red-200 bg-red-50 text-red-600", boton: "bg-red-600 hover:bg-red-700" },
  warning: { icono: "border-amber-200 bg-amber-50 text-amber-600", boton: "bg-amber-600 hover:bg-amber-700" },
  primary: { icono: "border-blue-200 bg-blue-50 text-blue-600", boton: "bg-blue-600 hover:bg-blue-700" },
};

/** Pregunta de confirmación antes de una acción (borrar, desactivar, guardar cambios grandes). */
export default function ConfirmDialog({
  open,
  title = "¿Estás seguro?",
  message,
  onConfirm,
  onClose,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  icon: Icono = variant === "danger" ? Trash2 : AlertTriangle,
}) {
  const estilo = ESTILOS[variant] ?? ESTILOS.danger;

  return (
    <Modal abierto={open} onCerrar={onClose} titulo={title} ocupado={loading} ancho="sm">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border", estilo.icono)}>
          <Icono className="h-5 w-5" aria-hidden="true" />
        </div>
        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn("flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50", estilo.boton)}
        >
          {loading ? "Procesando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
