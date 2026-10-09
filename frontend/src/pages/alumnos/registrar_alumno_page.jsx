import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, IdCard, Phone, Mail, Dumbbell, CheckCircle2 } from "lucide-react";
import RegisterSuccessModal from "../components/modal/register_success_modal.jsx";

import InputField from "../components/form/input_field.jsx";
import SelectField from "../components/form/select_field.jsx";
import FormError from "../components/form/form_error.jsx";

import { useCatalogos } from "../hook/use_catalogos.js";
import { registrarAlumno } from "../api/alumnos_api.js";

const TIPO_DOCUMENTO_FIJO = 1;
const TIPO_PERSONA_FIJO   = 1;

const schema = z.object({
  documento:          z.string().trim().min(6, "DNI inválido").max(12, "DNI inválido"),
  nombre:             z.string().trim().min(2, "Nombre muy corto"),
  apellido:           z.string().trim().min(2, "Apellido muy corto"),
  fecha_nacimiento:   z.string().min(1, "Fecha de nacimiento requerida"),
  tipo_documento_id:  z.number({ invalid_type_error: "Elegí tipo documento" }).int().positive(),
  tipo_persona_id:    z.number({ invalid_type_error: "Elegí tipo persona"   }).int().positive(),
  sexo_id:            z.number({ invalid_type_error: "Sexo inválido" }).int().positive().optional(),
  email:              z.string().email("Email inválido").optional().or(z.literal("")),
  celular:            z.string().optional().or(z.literal("")),
  celular_emergencia: z.string().optional().or(z.literal("")),
});

function SectionHeader({ number, label, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
        {number}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-sky-600" />}
        <span className="text-sm font-bold uppercase tracking-wider text-slate-600">{label}</span>
      </div>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

export default function RegisterAlumnoPage() {
  const nav = useNavigate();
  const [error, setError]       = useState(null);
  const [mostrarOk, setMostrarOk] = useState(false);
  const [dataOk, setDataOk]     = useState(null);

  const { data: catalogos, loading: loadingCatalogos, error: errorCatalogos } = useCatalogos();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      documento: "", nombre: "", apellido: "", fecha_nacimiento: "",
      tipo_documento_id: TIPO_DOCUMENTO_FIJO, tipo_persona_id: TIPO_PERSONA_FIJO,
      sexo_id: undefined, email: "", celular: "", celular_emergencia: "",
    },
  });

  useEffect(() => {
    if (!loadingCatalogos) {
      setValue("tipo_documento_id", TIPO_DOCUMENTO_FIJO);
      setValue("tipo_persona_id",   TIPO_PERSONA_FIJO);
    }
  }, [loadingCatalogos, setValue]);

  async function onSubmit(values) {
    setError(null);
    try {
      const r = await registrarAlumno({
        tipo_documento_id:  values.tipo_documento_id,
        sexo_id:            values.sexo_id ?? null,
        tipo_persona_id:    values.tipo_persona_id,
        documento:          values.documento,
        nombre:             values.nombre,
        apellido:           values.apellido,
        fecha_nacimiento:   values.fecha_nacimiento,
        email:              values.email || null,
        celular:            values.celular || null,
        celular_emergencia: values.celular_emergencia || null,
      });

      if (!r?.ok) { setError(r?.mensaje || "No se pudo registrar"); return; }

      setDataOk(r);
      setMostrarOk(true);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.mensaje || err?.message || "Error inesperado al registrar");
    }
  }

  if (errorCatalogos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow">
          <p className="font-bold text-red-600">Error al cargar catálogos</p>
          <p className="mt-1 text-sm text-slate-500">Verificá la conexión con el servidor e intentá de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

        {/* ── PANEL IZQUIERDO (desktop) ─────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-[#060a12] px-14 py-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
              <Dumbbell size={22} className="text-sky-400" />
            </div>
            <span className="font-bold uppercase tracking-widest text-white">Dynamic Gym</span>
          </div>

          {/* Texto central */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400">
              Gestión de alumnos
            </span>
            <h1 className="mt-3 text-5xl font-black uppercase leading-tight text-white">
              ALTA DE<br />
              <span className="text-sky-400">ALUMNO</span>
            </h1>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              Completá el formulario para registrar a un nuevo alumno en el sistema.
              Los datos de contacto son opcionales.
            </p>

            {/* Checklist */}
            <ul className="mt-8 space-y-3">
              {[
                "DNI del alumno",
                "Nombre y apellido completo",
                "Fecha de nacimiento",
                "Email y teléfono (opcional)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle2 size={16} className="shrink-0 text-sky-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-700 uppercase tracking-wider">
            Dynamic Gym · Sistema interno
          </p>
        </div>

        {/* ── PANEL DERECHO — formulario ─────────────────── */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-14 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto">

            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                <UserPlus size={13} />
                Registro de alumno
              </div>
            </div>

            {/* Título */}
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900">Nuevo alumno</h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá los datos para dar de alta al alumno.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* ── SECCIÓN 1: Datos personales ── */}
              <div>
                <SectionHeader number="1" label="Datos personales" icon={IdCard} />
                <div className="space-y-4">

                  <InputField
                    label="DNI *"
                    name="documento"
                    register={register}
                    error={errors?.documento?.message}
                    placeholder="Ej: 48146705"
                    inputMode="numeric"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Nombre *"
                      name="nombre"
                      register={register}
                      error={errors?.nombre?.message}
                      placeholder="Juan"
                    />
                    <InputField
                      label="Apellido *"
                      name="apellido"
                      register={register}
                      error={errors?.apellido?.message}
                      placeholder="Pérez"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Fecha de nacimiento *"
                      name="fecha_nacimiento"
                      register={register}
                      error={errors?.fecha_nacimiento?.message}
                      type="date"
                    />
                    <SelectField
                      label="Sexo"
                      name="sexo_id"
                      register={register}
                      error={errors?.sexo_id?.message}
                      options={catalogos?.sexos || []}
                      placeholder="(Opcional)"
                      asNumber={true}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Tipo de documento"
                      name="tipo_documento_id"
                      register={register}
                      error={errors?.tipo_documento_id?.message}
                      options={catalogos?.tiposDocumento || []}
                      fijoValue={TIPO_DOCUMENTO_FIJO}
                      disabledVisual={true}
                      asNumber={true}
                    />
                    <SelectField
                      label="Tipo de persona"
                      name="tipo_persona_id"
                      register={register}
                      error={errors?.tipo_persona_id?.message}
                      options={catalogos?.tiposPersona || []}
                      fijoValue={TIPO_PERSONA_FIJO}
                      disabledVisual={true}
                      asNumber={true}
                    />
                  </div>

                </div>
              </div>

              {/* ── SECCIÓN 2: Contacto ── */}
              <div>
                <SectionHeader number="2" label="Contacto (opcional)" icon={Phone} />
                <div className="space-y-4">

                  <InputField
                    label="Email"
                    name="email"
                    register={register}
                    error={errors?.email?.message}
                    placeholder="juan@mail.com"
                    type="email"
                    icon={Mail}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Celular"
                      name="celular"
                      register={register}
                      error={errors?.celular?.message}
                      placeholder="3705123456"
                      inputMode="numeric"
                    />
                    <InputField
                      label="Celular emergencia"
                      name="celular_emergencia"
                      register={register}
                      error={errors?.celular_emergencia?.message}
                      placeholder="3705123456"
                      inputMode="numeric"
                    />
                  </div>

                </div>
              </div>

              {/* ── ERROR + SUBMIT ── */}
              <div className="space-y-4 pt-2">
                <FormError message={error} />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-sky-500/25 hover:bg-sky-400 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <UserPlus size={16} />
                  {isSubmitting ? "Registrando…" : "Registrar alumno"}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

      <RegisterSuccessModal
        open={mostrarOk}
        persona={dataOk?.persona}
        alumno={dataOk?.alumno}
        delayMs={5000}
        onFinish={() => { setMostrarOk(false); setDataOk(null); nav("/kiosk"); }}
      />
    </>
  );
}
