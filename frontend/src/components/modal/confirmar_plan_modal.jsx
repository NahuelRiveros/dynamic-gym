export default function ConfirmarActualizacionPlanModal({
  abierto,
  alumno,
  form,
  tipoPlanSeleccionado,
  guardando,
  onCancelar,
  onConfirmar,
}) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800">
          Confirmar actualización
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Vas a modificar el plan vigente del alumno.
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
          <div>
            <b>Alumno:</b> {alumno?.nombre} {alumno?.apellido}
          </div>
          <div>
            <b>DNI:</b> {alumno?.documento}
          </div>
          <div>
            <b>Tipo de plan:</b>{" "}
            {tipoPlanSeleccionado?.gym_cat_tipoplan_descripcion || "—"}
          </div>
          <div>
            <b>Fecha inicio:</b> {form?.fecha_inicio || "—"}
          </div>
          <div>
            <b>Fecha fin:</b> {form?.fecha_fin || "—"}
          </div>
          <div>
            <b>Ingresos disponibles:</b>{" "}
            {form?.ingresos_disponibles === "" ? "—" : form?.ingresos_disponibles}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="rounded-xl border px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            disabled={guardando}
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}