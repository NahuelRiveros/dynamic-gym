import { estadoApertura } from "../../config/gimnasio.js";
import { cn } from "../../lib/cn.js";

/** "Abierto ahora, hasta las 23 h" o cuándo abre, en hora argentina. */
export default function EstadoApertura() {
  const { abierto, texto } = estadoApertura();
  return <span className={cn("ini-estado", abierto && "ini-abierto")}>{texto}</span>;
}
