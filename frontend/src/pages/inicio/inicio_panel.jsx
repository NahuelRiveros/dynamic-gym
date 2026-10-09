import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../auth/auth_context.jsx";
import { menuPara } from "../../auth/permisos.js";
import { cn } from "../../lib/cn.js";
import { fechaDeHoy, saludoSegunHora } from "./saludo.js";

/**
 * Inicio con sesión: un saludo y las tareas de cada uno a un toque, con lo mismo que ve en el menú
 * (si no puede abrirlo, no aparece). La primera sección (Recepción) va más grande: es la del día a día.
 * No consulta nada al servidor: abrir el inicio no despierta a Neon.
 */
export default function InicioPanel() {
  const { usuario } = useAuth();
  const grupos = menuPara(usuario).filter((g) => g.titulo);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <p className="text-sm font-medium text-slate-500 first-letter:uppercase">{fechaDeHoy()}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
        {saludoSegunHora()}
        {usuario?.nombre ? `, ${usuario.nombre}` : ""}
      </h1>
      <p className="mt-1 text-slate-500">
        ¿Qué querés hacer?{" "}
        <Link to="/gimnasio" className="font-medium text-sky-700 hover:underline">
          Ver el sitio web
        </Link>
      </p>

      <div className="mt-8 space-y-8">
        {grupos.map((grupo, i) => (
          <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`}>
            <h2 id={`grupo-${grupo.id}`} className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              {grupo.titulo}
            </h2>
            <ul className={cn("grid gap-3", i === 0 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4")}>
              {grupo.items.map((item) => {
                const Icono = item.icono;
                const principal = i === 0;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.ruta}
                      className={cn(
                        "group flex h-full items-center gap-4 rounded-2xl border bg-white transition outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-sky-400",
                        principal ? "border-sky-100 p-5 shadow-sm shadow-sky-500/5" : "border-slate-200 p-4",
                      )}
                    >
                      {Icono && (
                        <span
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-xl transition",
                            principal ? "h-12 w-12 bg-sky-600 text-white group-hover:bg-sky-700" : "h-10 w-10 bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700",
                          )}
                        >
                          <Icono aria-hidden="true" className={principal ? "h-6 w-6" : "h-5 w-5"} />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block font-semibold text-slate-900", principal && "text-base")}>{item.titulo}</span>
                        {item.descripcion && <span className="mt-0.5 block text-sm text-slate-500">{item.descripcion}</span>}
                      </span>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
