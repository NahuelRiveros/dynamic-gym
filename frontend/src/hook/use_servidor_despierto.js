import { useEffect } from "react";
import { verificarServidor } from "../api/health.js";
import { estaAbierto } from "../config/gimnasio.js";

// Render (plan gratis) se apaga a los 15 min sin pedidos y tarda 30-60 s en volver: el primer
// alumno después de un rato tranquilo esperaba todo eso. Cada 10 min, y solo con el gimnasio
// abierto, el kiosco toca /health, que NO consulta la base: Neon sigue durmiendo y no cobra.
const CADA_MS = 10 * 60 * 1000;

function tocar() {
  if (estaAbierto()) verificarServidor().catch(() => {});
}

/** Mantiene despierto al servidor mientras el kiosco está abierto en horario del gimnasio. */
export function useServidorDespierto() {
  useEffect(() => {
    tocar();
    const id = setInterval(tocar, CADA_MS);
    return () => clearInterval(id);
  }, []);
}
