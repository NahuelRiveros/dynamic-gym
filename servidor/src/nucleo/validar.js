import { DatosInvalidos } from "./errores.js";

/**
 * Middleware: valida body / query / params con schemas de Zod. Si algo no cumple responde 400
 * VALIDACION con el primer problema como mensaje y todos en `detalles`. Los datos limpios
 * (ya convertidos: números, DNI sin puntos) quedan en req.datos.body / .query / .params.
 */
export function validar(schemas) {
  return (req, _res, next) => {
    req.datos = {};
    for (const parte of ["params", "query", "body"]) {
      if (!schemas[parte]) continue;
      const r = schemas[parte].safeParse(req[parte] ?? {});
      if (!r.success) {
        const detalles = r.error.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message }));
        throw new DatosInvalidos({ mensaje: detalles[0].mensaje, detalles });
      }
      req.datos[parte] = r.data;
    }
    next();
  };
}
