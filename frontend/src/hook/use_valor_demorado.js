import { useEffect, useState } from "react";

/**
 * Devuelve `valor` recién cuando deja de cambiar por `ms` milisegundos. Para búsquedas: se
 * consulta al servidor cuando el usuario termina de escribir, no en cada tecla (menos carga en Neon).
 */
export function useValorDemorado(valor, ms = 300) {
  const [demorado, setDemorado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);

  return demorado;
}
