import { useState } from "react";

const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Filtros que se aplican con un botón ("Actualizar"), no en cada tecla. La consulta usa
 * `aplicados` en su queryKey. `aplicar(nuevos)` devuelve false si no cambió nada: en ese caso
 * la pantalla llama a refetch() para pedir los datos de nuevo.
 */
export function useFiltros(inicial) {
  const [aplicados, setAplicados] = useState(inicial);

  function aplicar(nuevos) {
    if (iguales(aplicados, nuevos)) return false;
    setAplicados(nuevos);
    return true;
  }

  return [aplicados, aplicar];
}
