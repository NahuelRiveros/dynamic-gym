/**
 * Caché en memoria para datos que casi no cambian (catálogos): menos consultas a Neon, que cobra
 * por tiempo despierta. Vence a los `ttlMs` o cuando se llama a `invalidar()` (al editar esos datos).
 * Vive en el proceso: con un solo servidor en Render alcanza.
 */
export function crearCache({ ttlMs }) {
  let valor;
  let vence = 0;
  let pendiente = null;

  return {
    async obtener(cargar) {
      if (Date.now() < vence) return valor;
      // Si llegan varios pedidos juntos con la caché vencida, se consulta una sola vez.
      pendiente ??= cargar()
        .then((v) => {
          valor = v;
          vence = Date.now() + ttlMs;
          return v;
        })
        .finally(() => {
          pendiente = null;
        });
      return pendiente;
    },
    invalidar() {
      vence = 0;
    },
  };
}
