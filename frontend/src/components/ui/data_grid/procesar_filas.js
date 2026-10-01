/** Valor de una columna como texto; `key` admite puntos para datos anidados ("persona.nombre"). */
export function valorDe(fila, key) {
  if (!key) return "";
  return String(key.split(".").reduce((acc, parte) => acc?.[parte], fila) ?? "");
}

/**
 * Búsqueda (en las columnas `searchable` que no lo desactiven) y orden, para el modo con todos
 * los datos en memoria. Compara números como números ("10" después de "9").
 */
export function procesarFilas({ filas, columnas, busqueda = "", orden = null }) {
  let resultado = filas;

  const q = busqueda.toLowerCase().trim();
  if (q) {
    const claves = columnas.filter((c) => c.searchable !== false).map((c) => c.key);
    resultado = resultado.filter((fila) => claves.some((k) => valorDe(fila, k).toLowerCase().includes(q)));
  }

  if (orden) {
    resultado = [...resultado].sort((a, b) => {
      const cmp = valorDe(a, orden.key).localeCompare(valorDe(b, orden.key), undefined, { numeric: true, sensitivity: "base" });
      return orden.dir === "asc" ? cmp : -cmp;
    });
  }

  return resultado;
}

/** Siguiente orden al tocar una columna: ascendente → descendente → sin orden. */
export function siguienteOrden(orden, key) {
  if (orden?.key !== key) return { key, dir: "asc" };
  if (orden.dir === "asc") return { key, dir: "desc" };
  return null;
}
