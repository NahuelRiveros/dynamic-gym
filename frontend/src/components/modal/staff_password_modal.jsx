import { useForm } from "react-hook-form";
import InputField from "../form/input_field.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

// Se monta cada vez que se abre el modal: los campos arrancan siempre vacíos.
function FormularioPassword({ onGuardar, onClose, cargando, errorServidor }) {
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ defaultValues: { password: "", confirmarPassword: "" } });

  function validar(data) {
    const password = String(data.password ?? "").trim();
    const confirmar = String(data.confirmarPassword ?? "").trim();
    const errores = {};

    if (!password) errores.password = "La contraseña es obligatoria";
    else if (password.length < 4) errores.password = "La contraseña debe tener al menos 4 caracteres";
    if (!confirmar) errores.confirmarPassword = "Debés confirmar la contraseña";
    else if (password !== confirmar) errores.confirmarPassword = "Las contraseñas no coinciden";

    for (const [campo, message] of Object.entries(errores)) setError(campo, { type: "manual", message });
    return Object.keys(errores).length === 0;
  }

  async function submit(data) {
    if (!validar(data)) return;
    await onGuardar({ password: String(data.password).trim() });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <InputField label="Nueva contraseña" name="password" register={register} error={errors.password?.message} placeholder="Mínimo 4 caracteres" type="password" autoComplete="new-password" />
      <InputField label="Confirmar contraseña" name="confirmarPassword" register={register} error={errors.confirmarPassword?.message} placeholder="Repetí la contraseña" type="password" autoComplete="new-password" />
      <ListaErrores errores={errorServidor ? [errorServidor] : []} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} textoConfirmar="Actualizar contraseña" />
    </form>
  );
}

export default function StaffPasswordModal({ abierto, onClose, onGuardar, staffSeleccionado = null, cargando = false, errorServidor = null }) {
  const nombreCompleto = staffSeleccionado ? `${staffSeleccionado.gym_persona_nombre} ${staffSeleccionado.gym_persona_apellido}` : "";

  return (
    <Modal
      abierto={abierto}
      onCerrar={onClose}
      titulo="Cambiar contraseña"
      descripcion={nombreCompleto ? `Actualizá la contraseña de ${nombreCompleto}.` : "Actualizá la contraseña del usuario."}
      ocupado={cargando}
      ancho="xl"
    >
      <FormularioPassword onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
