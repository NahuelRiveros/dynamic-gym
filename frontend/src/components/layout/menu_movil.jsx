import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { estaActiva } from "../../auth/permisos.js";
import { cn } from "../../lib/cn.js";
import TarjetaUsuario from "./tarjeta_usuario.jsx";

/**
 * Menú completo del celular: una hoja que sube desde abajo, al alcance del pulgar. Es un <dialog>
 * nativo (como ui/modal): el foco queda adentro, Escape cierra y el foco vuelve al botón "Más".
 * Se monta solo abierta.
 */
export default function MenuMovil({ menu = [], actual = null, onCerrar }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialogo = ref.current;
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialogo.close();
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      aria-label="Menú"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
        <span aria-hidden="true" className="absolute top-1.5 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
        <p className="text-base font-bold">Menú</p>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar menú"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Menú completo" className="px-4 pt-2 pb-4">
        {menu.map((grupo) => (
          <section key={grupo.id} className="mt-4 first:mt-2">
            {grupo.titulo && <h2 className="mb-2 px-1 text-xs font-semibold tracking-wider text-slate-500 uppercase">{grupo.titulo}</h2>}
            <ul className="grid grid-cols-3 gap-2">
              {grupo.items.map((item) => {
                const Icono = item.icono;
                const activa = estaActiva(item, actual);
                return (
                  <li key={item.id}>
                    <Link
                      to={item.ruta}
                      onClick={onCerrar}
                      aria-current={activa ? "page" : undefined}
                      className={cn(
                        "flex h-full min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center text-xs leading-tight font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                        activa ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-100 bg-slate-50 text-slate-700 active:bg-slate-100",
                      )}
                    >
                      {Icono && <Icono aria-hidden="true" className={cn("h-6 w-6", activa ? "text-sky-600" : "text-slate-500")} />}
                      {item.titulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <TarjetaUsuario onSalir={onCerrar} />
      </div>
    </dialog>,
    document.body,
  );
}
