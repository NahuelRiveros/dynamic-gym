import { useForm } from "react-hook-form";
import InputField from "../form/input_field.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

const desdeStaff = (staff) => ({
  nombre: staff?.gym_persona_nombre || "",
  apellido: staff?.gym_persona_apellido || "",
  email: staff?.gym_persona_email || "",
  documento: staff?.gym_persona_documento || "",
  password: "",
});

// Se monta cada vez que se abre el modal: los valores iniciales salen del staff a editar.
function FormularioStaff({ staffEditar, onGuardar, onClose, cargando, errorServidor }) {
  const esEdicion = Boolean(staffEditar);
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ defaultValues: desdeStaff(staffEditar) });

  function validar(data) {
    const errores = {};
    if (!data.nombre?.trim()) errores.nombre = "El nombre es obligatorio";
    if (!data.apellido?.trim()) errores.apellido = "El apellido es obligatorio";
    if (!data.email?.trim()) errores.email = "El email es obligatorio";
    if (!data.documento?.trim()) errores.documento = "El documento es obligatorio";
    else if (!/^\d+$/.test(String(data.documento).trim())) errores.documento = "El documento debe contener solo números";
    if (!esEdicion) {
      if (!data.password?.trim()) errores.password = "La contraseña es obligatoria";
      else if (String(data.password).trim().length < 4) errores.password = "La contraseña debe tener al menos 4 caracteres";
    }

    for (const [campo, message] of Object.entries(errores)) setError(campo, { type: "manual", message });
    return Object.keys(errores).length === 0;
  }

  async function submit(data) {
    if (!validar(data)) return;

    const payload = {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      email: data.email.trim().toLowerCase(),
      documento: String(data.documento).trim(),
    };
    if (!esEdicion) payload.password = String(data.password).trim();

    await onGuardar(payload);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} placeholder="Ej: Juan" />
        <InputField label="Apellido" name="apellido" register={register} error={errors.apellido?.message} placeholder="Ej: Pérez" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField label="Email" name="email" register={register} error={errors.email?.message} placeholder="Ej: juan.staff@gym.com" type="email" autoComplete="email" />
        <InputField label="Documento" name="documento" register={register} error={errors.documento?.message} placeholder="Solo números" inputMode="numeric" />
      </div>

      {!esEdicion && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField label="Contraseña" name="password" register={register} error={errors.password?.message} placeholder="Mínimo 4 caracteres" type="password" autoComplete="new-password" />
        </div>
      )}

      <ListaErrores errores={errorServidor ? [errorServidor] : []} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} textoConfirmar={esEdicion ? "Guardar cambios" : "Crear staff"} />
    </form>
  );
}

export default function StaffFormModal({ abierto, onClose, onGuardar, staffEditar = null, cargando = false, errorServidor = null }) {
  const esEdicion = Boolean(staffEditar);
  return (
    <Modal
      abierto={abierto}
      onCerrar={onClose}
      titulo={esEdicion ? "Editar staff" : "Nuevo staff"}
      descripcion={esEdicion ? "Modificá los datos generales del usuario." : "Creá un nuevo usuario con rol staff."}
      ocupado={cargando}
      ancho="2xl"
    >
      <FormularioStaff staffEditar={staffEditar} onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
