import { AlertCircle } from "lucide-react";

/** Error al enviar un formulario. `role="alert"`: el lector de pantalla lo anuncia apenas aparece. */
export default function FormError({ message }) {
  if (!message) return null;

  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
