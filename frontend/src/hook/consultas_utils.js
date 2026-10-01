/**
 * El API responde { ok: false, mensaje } en algunos errores con status 200: para TanStack Query
 * eso también es un error (así se muestra el mensaje y el botón de reintentar).
 */
export function exigirOk(respuesta, mensajePorDefecto = "No se pudieron cargar los datos") {
  if (!respuesta?.ok) throw new Error(respuesta?.mensaje || mensajePorDefecto);
  return respuesta;
}

/** Mensaje para mostrar de un error de axios o de exigirOk. */
export function mensajeDeError(error, porDefecto = "Error inesperado") {
  return error?.response?.data?.mensaje || error?.message || porDefecto;
}
