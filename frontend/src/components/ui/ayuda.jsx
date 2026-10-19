import { useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "../../lib/cn.js";

const ANCHO = 256;
const MARGEN = 16;

// Fijo en la pantalla (no dentro de su contenedor): así un modal o una tarjeta angosta no lo corta,
// y se corre para no salirse por los costados del celular.
function posicionDe(boton) {
  const r = boton.getBoundingClientRect();
  const ancho = Math.min(ANCHO, window.innerWidth - MARGEN * 2);
  const left = Math.min(Math.max(r.left, MARGEN), window.innerWidth - MARGEN - ancho);
  return { top: r.bottom + 6, left, width: ancho };
}

/**
 * Botón (?) que explica algo de la pantalla. Con mouse se abre al pasar por encima; en el celular,
 * al tocarlo (el hover que simula el celular se ignora). El clic solo abre: alternar haría que el
 * clic de quien ya la abrió con el mouse la cierre. Se cierra tocando afuera, saliendo con el mouse
 * o con Escape (sin cerrar el modal donde está).
 */
export default function Ayuda({ texto, etiqueta = "Más información", className = "" }) {
  const [posicion, setPosicion] = useState(null);
  const boton = useRef(null);
  const id = useId();
  const abierta = posicion !== null;

  const abrir = () => setPosicion(posicionDe(boton.current));
  const cerrar = () => setPosicion(null);
  const conMouse = (e) => e.pointerType === "mouse";

  return (
    <span
      className="inline-flex align-middle"
      onPointerEnter={(e) => conMouse(e) && abrir()}
      onPointerLeave={(e) => conMouse(e) && cerrar()}
    >
      <button
        ref={boton}
        type="button"
        aria-label={etiqueta}
        aria-expanded={abierta}
        aria-describedby={abierta ? id : undefined}
        onClick={abrir}
        onBlur={cerrar}
        onKeyDown={(e) => {
          if (e.key === "Escape" && abierta) {
            e.preventDefault();
            e.stopPropagation();
            cerrar();
          }
        }}
        className={cn(
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition outline-none hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400",
          className,
        )}
      >
        <CircleHelp aria-hidden="true" className="h-4 w-4" />
      </button>
      {abierta && (
        <span
          role="tooltip"
          id={id}
          style={posicion}
          className="fixed z-50 rounded-xl bg-slate-900 px-3 py-2 text-left text-xs leading-relaxed font-normal tracking-normal text-white normal-case shadow-lg"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
