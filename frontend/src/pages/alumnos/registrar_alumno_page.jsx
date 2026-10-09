import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2, Mail, Phone, UserPlus } from "lucide-react";
import FormError from "../../components/form/form_error.jsx";
import InputField from "../../components/form/input_field.jsx";
import SelectField from "../../components/form/select_field.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useRegistrarAlumno } from "../../hook/use_alumnos.js";
import { useCatalogos } from "../../hook/use_catalogos.js";
import { hoyAR } from "../../lib/fecha_ar.js";
import ResultadoAlta from "./resultado_alta.jsx";

// DNI y alumno (no staff): son siempre los mismos, no hace falta mostrarlos.
const TIPO_DOCUMENTO_DNI = 1;
const TIPO_PERSONA_ALUMNO = 1;

const hoyISO = () => {
  const { anio, mes, dia } = hoyAR();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};
const telefono = z.string().trim().regex(/^[\d\s+()-]*$/, "Solo números");

const esquema = z.object({
  documento: z
    .string()
    .transform((v) => v.replace(/[.\s]/g, ""))
    .pipe(z.string().regex(/^\d{6,12}$/, "El DNI tiene que tener entre 6 y 12 números")),
  nombre: z.string().trim().min(2, "Escribí el nombre"),
  apellido: z.string().trim().min(2, "Escribí el apellido"),
  // Se usa para los avisos de cumpleaños del kiosco.
  fecha_nacimiento: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine((f) => f <= hoyISO(), "La fecha no puede ser futura"),
  sexo_id: z.union([z.number(), z.literal("")]).optional(),
  email: z.string().trim().toLowerCase().email("Email inválido").or(z.literal("")),
  celular: telefono,
  celular_emergencia: telefono,
});

const VACIO = { documento: "", nombre: "", apellido: "", fecha_nacimiento: "", sexo_id: "", email: "", celular: "", celular_emergencia: "" };

function Seccion({ titulo, icono: Icono, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
        {Icono && <Icono aria-hidden="true" className="h-4 w-4 text-slate-400" />}
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

/** Formulario de alta. Se monta de nuevo para cada alumno (key): arranca siempre limpio. */
function FormularioAlta({ dniInicial, alta }) {
  const { data: catalogos } = useCatalogos();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(esquema), defaultValues: { ...VACIO, documento: dniInicial } });

  const enviar = (v) =>
    alta.mutate({
      ...v,
      tipo_documento_id: TIPO_DOCUMENTO_DNI,
      tipo_persona_id: TIPO_PERSONA_ALUMNO,
      sexo_id: v.sexo_id || null,
      email: v.email || null,
      celular: v.celular || null,
      celular_emergencia: v.celular_emergencia || null,
    });

  const duplicado = alta.error?.response?.data?.codigo === "DOCUMENTO_DUPLICADO";

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <Seccion titulo="Datos del alumno">
        <InputField label="DNI" name="documento" register={register} error={errors.documento?.message} placeholder="Ej: 30111222" inputMode="numeric" autoComplete="off" autoFocus />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Nombre" name="nombre" register={register} error={errors.nombre?.message} placeholder="Ej: Juan" autoComplete="off" />
          <InputField label="Apellido" name="apellido" register={register} error={errors.apellido?.message} placeholder="Ej: Pérez" autoComplete="off" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Fecha de nacimiento" name="fecha_nacimiento" register={register} error={errors.fecha_nacimiento?.message} type="date" max={hoyISO()} />
          <SelectField label="Sexo (opcional)" name="sexo_id" register={register} options={catalogos?.sexos ?? []} placeholder="Sin indicar" asNumber />
        </div>
      </Seccion>

      <Seccion titulo="Contacto (opcional)" icono={Phone}>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Celular" name="celular" register={register} error={errors.celular?.message} placeholder="Ej: 3704 123456" inputMode="tel" type="tel" />
          <InputField label="Celular de emergencia" name="celular_emergencia" register={register} error={errors.celular_emergencia?.message} placeholder="De un familiar" inputMode="tel" type="tel" />
        </div>
        <InputField label="Email" name="email" register={register} error={errors.email?.message} helperText="Para las promociones por mail." placeholder="Ej: juan@gmail.com" type="email" icon={Mail} />
      </Seccion>

      <div className="space-y-3 border-t border-slate-100 pt-5">
        {alta.isError && (
          <div className="space-y-2">
            <FormError message={mensajeDeError(alta.error, "No se pudo registrar al alumno")} />
            {duplicado && (
              <Link to={`/admin/pagos/registrar?dni=${alta.variables?.documento}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline">
                <CreditCard aria-hidden="true" className="h-4 w-4" />
                Ya está cargado: cobrarle el plan
              </Link>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={alta.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-sm transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {alta.isPending ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <UserPlus aria-hidden="true" className="h-5 w-5" />}
          {alta.isPending ? "Guardando…" : "Dar de alta"}
        </button>
      </div>
    </form>
  );
}

/** Nuevo alumno: alta con lo mínimo y, al terminar, el atajo para cobrarle el plan. */
export default function RegisterAlumnoPage() {
  // Desde "Cobrar plan" (DNI que no existe) se llega con ?dni=: ya queda escrito.
  const [params] = useSearchParams();
  const [vuelta, setVuelta] = useState(0);
  const alta = useRegistrarAlumno();

  function otro() {
    alta.reset();
    setVuelta((v) => v + 1);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Nuevo alumno</h1>
        <p className="mt-1 text-sm text-slate-500">Con el DNI, el nombre y la fecha de nacimiento alcanza. Después le cobrás el plan.</p>
      </div>

      {alta.isSuccess ? (
        <ResultadoAlta persona={alta.data.persona} alumno={alta.data.alumno} onOtro={otro} />
      ) : (
        <FormularioAlta key={vuelta} dniInicial={vuelta === 0 ? (params.get("dni") ?? "") : ""} alta={alta} />
      )}
    </div>
  );
}
