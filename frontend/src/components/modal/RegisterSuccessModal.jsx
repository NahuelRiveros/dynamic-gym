import { useEffect, useRef } from "react";
import SubmitButton from "../form/submit_button";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccessModal({
  open,
  persona,
  alumno,
  delayMs = 5000,
  onFinish,
}) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    timerRef.current = setTimeout(() => onFinish?.(), delayMs);
    return () => clearTimeout(timerRef.current);
  }, [open, delayMs, onFinish]);

  function continuarAhora() {
    clearTimeout(timerRef.current);
    onFinish?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-center">
        <CheckCircle className="mx-auto text-green-600" size={52} />

        <h2 className="text-2xl font-bold mt-4">¡Registro exitoso!</h2>

        {(persona?.nombre || persona?.apellido) && (
          <p className="text-gray-700 mt-2">
            Alumno: <b>{persona?.nombre} {persona?.apellido}</b>
          </p>
        )}

        {persona?.documento && (
          <p className="text-sm text-gray-600 mt-1">
            DNI: <b>{persona.documento}</b>
          </p>
        )}

        {alumno?.alumno_id && (
          <p className="text-sm text-gray-600 mt-1">
            Alumno ID: <b>{alumno.alumno_id}</b>
          </p>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Redirigiendo automáticamente…
        </p>

        <div className="mt-6 flex justify-center">
          <SubmitButton type="button" label="Continuar" onClick={continuarAhora} />
        </div>
      </div>
    </div>
  );
}
