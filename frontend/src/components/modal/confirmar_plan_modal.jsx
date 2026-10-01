import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";

export default function ConfirmarActualizacionPlanModal({
  abierto,
  alumno,
  form,
  tipoPlanSeleccionado,
  guardando,
  onCancelar,
  onConfirmar,
}) {
  const datos = [
    ["Alumno", `${alumno?.nombre ?? ""} ${alumno?.apellido ?? ""}`.trim()],
    ["DNI", alumno?.documento],
    ["Tipo de plan", tipoPlanSeleccionado?.label],
    ["Fecha inicio", form?.fecha_inicio],
    ["Fecha fin", form?.fecha_fin],
    ["Ingresos disponibles", form?.ingresos_disponibles],
  ];

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCancelar}
      titulo="Confirmar actualización"
      descripcion="Vas a modificar el plan vigente del alumno."
      ocupado={guardando}
    >
      <dl className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        {datos.map(([rotulo, valor]) => (
          <div key={rotulo} className="flex gap-1">
            <dt className="font-bold">{rotulo}:</dt>
            <dd>{valor === "" || valor == null ? "—" : valor}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <BotonesModal onCancelar={onCancelar} onConfirmar={onConfirmar} ocupado={guardando} textoConfirmar="Confirmar" />
      </div>
    </Modal>
  );
}
