import { useConsultaMedia } from "../../hook/use_consulta_media.js";
import { cn } from "../../lib/cn.js";
import BarraPiezas from "./barra_piezas.jsx";
import Cierre from "./cierre.jsx";
import Horarios from "./horarios.jsx";
import Recorrido from "./recorrido.jsx";
import Salon from "./salon.jsx";
import "./inicio.css";

/**
 * Página pública del gimnasio: para quien todavía no entrena acá (y un atajo para los alumnos).
 * Quien pidió menos movimiento en su dispositivo ve lo mismo, quieto y sin escenas fijas.
 */
export default function LandingPublica() {
  const animado = !useConsultaMedia("(prefers-reduced-motion: reduce)");

  return (
    <div className="ini-marco dg-body-font">
      <div className={cn("ini", animado && "ini-anim")}>
        <BarraPiezas />
        <Recorrido animado={animado} />
        <Salon animado={animado} />
        <Horarios />
        <Cierre animado={animado} />
      </div>
    </div>
  );
}
