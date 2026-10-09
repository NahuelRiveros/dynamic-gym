import { Link } from "react-router-dom";
import { Cake, CalendarCheck, CreditCard, Mail, PencilLine, Phone } from "lucide-react";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { edad } from "../../lib/fecha_ar.js";

const fecha = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) : null);

function Contacto({ icono: Icono, children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-600">
      <Icono aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
      {children}
    </li>
  );
}

/** Encabezado de la ficha: quién es, cómo contactarlo y lo que se le puede hacer. */
export default function DatosAlumno({ alumno, esAdmin = false, rutaCobrar, rutaCorregir }) {
  const nombre = `${alumno.gym_persona_nombre ?? ""} ${alumno.gym_persona_apellido ?? ""}`.trim();
  const iniciales = `${alumno.gym_persona_nombre?.[0] ?? ""}${alumno.gym_persona_apellido?.[0] ?? ""}`.toUpperCase() || "?";
  const anios = edad(alumno.gym_persona_fechanacimiento);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start gap-4">
        <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-extrabold text-white">
          {iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{nombre || "Alumno"}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            DNI {alumno.gym_persona_documento}
            {alumno.estado_desc && <> · Acceso {alumno.estado_desc.toLowerCase()}</>}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
            {alumno.gym_persona_celular && (
              <Contacto icono={Phone}>
                <a href={`tel:${alumno.gym_persona_celular}`} className="hover:text-sky-700 hover:underline">
                  {alumno.gym_persona_celular}
                </a>
              </Contacto>
            )}
            {alumno.gym_persona_email && (
              <Contacto icono={Mail}>
                <a href={`mailto:${alumno.gym_persona_email}`} className="break-all hover:text-sky-700 hover:underline">
                  {alumno.gym_persona_email}
                </a>
              </Contacto>
            )}
            {anios !== null && (
              <Contacto icono={Cake}>
                {anios} años ({fecha(alumno.gym_persona_fechanacimiento)})
              </Contacto>
            )}
            {alumno.gym_alumno_fecharegistro && <Contacto icono={CalendarCheck}>Alumno desde {fecha(alumno.gym_alumno_fecharegistro)}</Contacto>}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link
          to={rutaCobrar}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition outline-none hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <CreditCard aria-hidden="true" className="h-4 w-4" />
          Cobrar / renovar plan
        </Link>
        {esAdmin && (
          <Link
            to={rutaCorregir}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <PencilLine aria-hidden="true" className="h-4 w-4" />
            Corregir plan o datos
          </Link>
        )}
      </div>
    </section>
  );
}
