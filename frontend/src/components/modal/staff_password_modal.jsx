import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../form/input_field.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

const esquema = z
  .object({
    password: z.string().trim().min(4, "La contraseña debe tener al menos 4 caracteres"),
    confirmarPassword: z.string().trim().min(1, "Debés confirmar la contraseña"),
  })
  .refine((d) => d.password === d.confirmarPassword, { path: ["confirmarPassword"], message: "Las contraseñas no coinciden" });

// Se monta cada vez que se abre el modal: los campos arrancan siempre vacíos.
function FormularioPassword({ onGuardar, onClose, cargando, errorServidor }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { password: "", confirmarPassword: "" },
  });

  return (
    <form onSubmit={handleSubmit(({ password }) => onGuardar({ password }))} className="space-y-4" noValidate>
      <InputField label="Nueva contraseña" name="password" register={register} error={errors.password?.message} placeholder="Mínimo 4 caracteres" type="password" showPasswordToggle autoComplete="new-password" />
      <InputField label="Confirmar contraseña" name="confirmarPassword" register={register} error={errors.confirmarPassword?.message} placeholder="Repetí la contraseña" type="password" showPasswordToggle autoComplete="new-password" />
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
      descripcion={
        nombreCompleto
          ? `Actualizá la contraseña de ${nombreCompleto}. La anterior deja de funcionar.`
          : "Actualizá la contraseña del usuario. La anterior deja de funcionar."
      }
      ocupado={cargando}
      ancho="xl"
    >
      <FormularioPassword onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
