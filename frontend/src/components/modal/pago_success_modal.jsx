import { useEffect, useRef } from "react";
import SubmitButton from "../form/submit_button";
import { CheckCircle } from "lucide-react";

export default function PagoSuccessModal({
  open,
  alumno,
  plan,
  pago,
  delayMs = 4000,
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

        <h2 className="text-2xl font-bold mt-4">¡Pago registrado!</h2>

        {(alumno?.nombre || alumno?.apellido) && (
          <p className="text-gray-700 mt-2">
            Alumno: <b>{alumno?.apellido} {alumno?.nombre}</b>
          </p>
        )}

        {alumno?.documento && (
          <p className="text-sm text-gray-600 mt-1">
            DNI: <b>{alumno.documento}</b>
          </p>
        )}

        {plan?.tipo_plan_descripcion && (
          <p className="text-sm text-gray-600 mt-2">
            Plan: <b>{plan.tipo_plan_descripcion}</b>
          </p>
        )}

        {(plan?.inicio || plan?.fin) && (
          <p className="text-sm text-gray-600 mt-1">
            Vigencia: <b>{plan?.inicio}</b> → <b>{plan?.fin}</b>
          </p>
        )}

        {typeof pago?.monto_pagado !== "undefined" && (
          <p className="text-sm text-gray-600 mt-1">
            Monto: <b>{Number(pago.monto_pagado).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</b>
          </p>
        )}

        {pago?.metodo_pago && (
          <p className="text-sm text-gray-600 mt-1">
            Método: <b>{pago.metodo_pago}</b>
          </p>
        )}

        <p className="text-xs text-gray-400 mt-3">
          Cerrando automáticamente…
        </p>

        <div className="mt-6 flex justify-center">
          <SubmitButton type="button" label="Continuar" onClick={continuarAhora} />
        </div>
      </div>
    </div>
  );
}