import Marca from "./marca.jsx";

/** Arriba del contenido: dónde se está (grupo del menú + nombre de la pantalla). */
export default function EncabezadoPanel({ grupo = null, titulo = "Dynamic Gym" }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6 lg:h-16">
      <div className="lg:hidden">
        <Marca soloLogo />
      </div>
      <div className="min-w-0">
        {grupo && <p className="hidden text-xs font-medium text-slate-500 lg:block">{grupo}</p>}
        <p className="truncate text-base font-semibold text-slate-900 lg:text-lg">{titulo}</p>
      </div>
    </header>
  );
}
