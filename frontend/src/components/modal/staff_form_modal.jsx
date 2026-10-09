import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../form/input_field.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

// Mismas reglas que el servidor (admin_staff_services): todo obligatorio, DNI solo números, clave de 4+.
const datosPersona = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  email: z.string().trim().toLowerCase().min(1, "El email es obligatorio").email("Email inválido"),
  documento: z
    .string()
    .transform((v) => v.replace(/[.\s]/g, ""))
    .pipe(z.string().min(1, "El documento es obligatorio").regex(/^\d+$/, "El documento debe contener solo números")),
};
const esquemaNuevo = z.object({ ...datosPersona, password: z.string().trim().min(4, "La contraseña debe tener al menos 4 caracteres") });
const esquemaEdicion = z.object(datosPersona);

const desdeStaff = (staff) => ({
  nombre: staff?.gym_persona_nombre || "",
  apellido: staff?.gym_persona_apellido || "",
  email: staff?.gym_persona_email || "",
  documento: staff?.gym_persona_documento || "",
  ...(staff ? {} : { password: "" }),
});

// Se monta cada vez que se abre el modal: los valores iniciales salen de la persona a editar.
function FormularioStaff({ staffEditar, onGuardar, onClose, cargando, errorServidor }) {
  const esEdicion = Boolean(staffEditar);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(esEdicion ? esquemaEdicion : esquemaNuevo),
    defaultValues: desdeStaff(staffEditar),
  });

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} placeholder="Ej: Juan" autoComplete="given-name" />
        <InputField label="Apellido" name="apellido" register={register} error={errors.apellido?.message} placeholder="Ej: Pérez" autoComplete="family-name" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InputField
          label="Email"
          name="email"
          register={register}
          error={errors.email?.message}
          helperText="Con este email inicia sesión."
          placeholder="Ej: juan@gmail.com"
          type="email"
          autoComplete="off"
        />
        <InputField label="DNI" name="documento" register={register} error={errors.documento?.message} placeholder="Solo números" inputMode="numeric" />
      </div>

      {!esEdicion && (
        <InputField
          label="Contraseña"
          name="password"
          register={register}
          error={errors.password?.message}
          helperText="Mínimo 4 caracteres. Pasásela a la persona: después la puede cambiar el admin."
          type="password"
          showPasswordToggle
          autoComplete="new-password"
        />
      )}

      <ListaErrores errores={errorServidor ? [errorServidor] : []} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} textoConfirmar={esEdicion ? "Guardar cambios" : "Agregar al personal"} />
    </form>
  );
}

export default function StaffFormModal({ abierto, onClose, onGuardar, staffEditar = null, cargando = false, errorServidor = null }) {
  const esEdicion = Boolean(staffEditar);
  return (
    <Modal
      abierto={abierto}
      onCerrar={onClose}
      titulo={esEdicion ? "Editar datos" : "Agregar al personal"}
      descripcion={
        esEdicion
          ? "Modificá los datos de la persona. La contraseña se cambia aparte."
          : "La persona va a poder iniciar sesión con permisos de recepción: ingreso, alumnos, cobros y ventas."
      }
      ocupado={cargando}
      ancho="2xl"
    >
      <FormularioStaff staffEditar={staffEditar} onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
