import { ErrorApp } from "./errores.js";

/**
 * Único lugar que responde errores no esperados. Express 5 manda acá los errores de las funciones
 * async, así que los controladores no necesitan try/catch. Nunca se envía el stack ni el mensaje
 * crudo de la base al navegador. Lleva 4 parámetros (aunque no use `_next`): así Express lo
 * reconoce como manejador de errores.
 */
export function manejadorErrores(err, req, res, _next) {
  const responder = (status, codigo, mensaje, detalles) =>
    res.status(status).json({ ok: false, codigo, mensaje, ...(detalles ? { detalles } : {}) });

  if (err instanceof ErrorApp) return responder(err.status, err.codigo, err.message, err.detalles);

  if (err?.type === "entity.parse.failed") return responder(400, "JSON_INVALIDO", "Body JSON inválido");

  if (err?.name === "SequelizeUniqueConstraintError") {
    const campo = err.errors?.[0]?.path;
    return responder(409, "DUPLICADO", campo ? `Ya existe un registro con ese ${campo}` : "Ese dato ya está registrado");
  }

  if (err?.name === "SequelizeForeignKeyConstraintError") {
    return responder(409, "EN_USO", "No se puede completar: el dato está relacionado con otros registros");
  }

  if (String(err?.message ?? "").startsWith("CORS:")) return responder(403, "CORS", "Origen no permitido");

  console.error(`❌ ${req.method} ${req.originalUrl}:`, err);
  return responder(500, "ERROR", "Error interno del servidor");
}
