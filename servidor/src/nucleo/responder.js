/**
 * Responde el resultado de un servicio ({ ok, codigo, ... }) tal cual, eligiendo el status por
 * código: así los controladores no repiten cadenas de if. Lo que no está en `estados` va con
 * `porDefecto` (400).
 *   responderResultado(res, r, { NO_EXISTE: 404, YA_INGRESO_HOY: 409 })
 */
export function responderResultado(res, resultado, estados = {}, porDefecto = 400) {
  if (resultado?.ok) return res.json(resultado);
  return res.status(estados[resultado?.codigo] ?? porDefecto).json(resultado);
}
