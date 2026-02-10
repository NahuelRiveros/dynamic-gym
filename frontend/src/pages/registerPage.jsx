import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import RegisterSuccessModal from "../components/modal/RegisterSuccessModal.jsx";

import FormCard from "../components/form/FormCard";
import InputField from "../components/form/InputField";
import SelectField from "../components/form/SelectField";
import SubmitButton from "../components/form/SubmitButton";
import FormError from "../components/form/FormError";

import { useCatalogos } from "../hook/useCatalogos.js";
import { registrarAlumno } from "../api/alumnos_api.js";

export default function RegisterAlumnoPage() {
  const nav = useNavigate();
  const [error, setError] = useState(null);
  const [mostrarOk, setMostrarOk] = useState(false);
  const [dataOk, setDataOk] = useState(null);


  const hookCatalogos = useCatalogos();
  const { data: catalogos, loading: loadingCatalogos, error: errorCatalogos } =
    hookCatalogos;

 
  const TIPO_DOCUMENTO_FIJO = 1;
  const TIPO_PERSONA_FIJO = 1;

  const schema = z.object({
    documento: z.string().min(6, "DNI inválido").max(12, "DNI inválido"),
    nombre: z.string().min(2, "Nombre muy corto"),
    apellido: z.string().min(2, "Apellido muy corto"),
    fecha_nacimiento: z.string().min(1, "Fecha de nacimiento requerida"),

    tipo_documento_id: z.number().int().positive("Elegí tipo documento"),
    tipo_persona_id: z.number().int().positive("Elegí tipo persona"),

    sexo_id: z.preprocess(
      (v) => (Number.isNaN(v) ? undefined : v),
      z.number().int().positive().optional()
    ),

    email: z.string().email("Email inválido").optional().or(z.literal("")),
    celular: z.string().optional().or(z.literal("")),
    celular_emergencia: z.string().optional().or(z.literal("")),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      documento: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",

      // ✅ NUMEROS (no strings vacíos)
      tipo_documento_id: TIPO_DOCUMENTO_FIJO,
      tipo_persona_id: TIPO_PERSONA_FIJO,
      sexo_id: undefined,

      email: "",
      celular: "",
      celular_emergencia: "",
    },
  });

  // ✅ cuando terminan de cargar catálogos, fijamos valores
  useEffect(() => {
    if (!loadingCatalogos) {
      setValue("tipo_documento_id", TIPO_DOCUMENTO_FIJO);
      setValue("tipo_persona_id", TIPO_PERSONA_FIJO);
    }
  }, [loadingCatalogos, setValue]);

  async function onSubmit(values) {
    setError(null);
    console.log("submit",values);
    try {
      const payload = {
        tipo_documento_id: values.tipo_documento_id,
        sexo_id: values.sexo_id ?? null,
        tipo_persona_id: values.tipo_persona_id,

        documento: values.documento,
        nombre: values.nombre,
        apellido: values.apellido,
        fecha_nacimiento: values.fecha_nacimiento,

        email: values.email || null,
        celular: values.celular || null,
        celular_emergencia: values.celular_emergencia || null,
      };

      const r = await registrarAlumno(payload);
      console.log(r)
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo registrar");
        return;
      }
      setDataOk(r);
      setMostrarOk(true);
      // (opcional) limpiar error
      setError(null);

      
    } catch (err) {
        const mensaje =
            err?.response?.data?.mensaje ||
            err?.message ||
            "Error inesperado al registrar";

        setError(mensaje);
    }
  }

  if (errorCatalogos) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow p-6">
          <h1 className="text-xl font-bold">Error</h1>
          <p className="text-sm text-gray-700 mt-2">
            No se pudieron cargar los catálogos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <FormCard titulo="Registro de Alumno" subtitulo="Alta (Persona + Alumno)">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <InputField
            label="DNI"
            name="documento"
            register={register}
            error={errors?.documento?.message}
            placeholder="48146705"
            inputMode="numeric"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Nombre"
              name="nombre"
              register={register}
              error={errors?.nombre?.message}
              placeholder="Juan"
            />
            <InputField
              label="Apellido"
              name="apellido"
              register={register}
              error={errors?.apellido?.message}
              placeholder="Pérez"
            />
          </div>

          <InputField
            label="Fecha nacimiento"
            name="fecha_nacimiento"
            register={register}
            error={errors?.fecha_nacimiento?.message}
            type="date"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SelectField
              label="Tipo documento"
              name="tipo_documento_id"
              register={register}
              error={errors?.tipo_documento_id?.message}
              options={catalogos?.tiposDocumento || []}
              fijoValue={TIPO_DOCUMENTO_FIJO}
              disabledVisual={true}
            />

            <SelectField
              label="Sexo (opcional)"
              name="sexo_id"
              register={register}
              error={errors?.sexo_id?.message}
              options={catalogos?.sexos || []}
              placeholder="(Opcional)"
            />
          </div>

          <SelectField
            label="Tipo persona"
            name="tipo_persona_id"
            register={register}
            error={errors?.tipo_persona_id?.message}
            options={catalogos?.tiposPersona || []}
            fijoValue={TIPO_PERSONA_FIJO}
            disabledVisual={true}
          />

          <InputField
            label="Email (opcional)"
            name="email"
            register={register}
            error={errors?.email?.message}
            placeholder="juan@mail.com"
            type="email"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Celular (opcional)"
              name="celular"
              register={register}
              error={errors?.celular?.message}
              placeholder="3705..."
              inputMode="numeric"
            />
            <InputField
              label="Celular emergencia (opcional)"
              name="celular_emergencia"
              register={register}
              error={errors?.celular_emergencia?.message}
              placeholder="3705..."
              inputMode="numeric"
            />
          </div>

          <FormError  message={error} />

          <div className="flex justify-center">
            <SubmitButton
              loading={isSubmitting}
              label="Registrar"
              loadingLabel="Registrando..."
            />
          </div>
        </form>
      </FormCard>
      <RegisterSuccessModal
        open={mostrarOk}
        persona={dataOk?.persona}
        alumno={dataOk?.alumno}
        delayMs={5000}
        onFinish={() => {
          setMostrarOk(false);
          setDataOk(null);
          nav("/kiosk"); // o "/home" o "/admin"
        }}
      />

    </div>
    
  );
}
