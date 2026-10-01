import { z } from "zod";

// Importar `z` siempre desde acá: los mensajes de error por defecto quedan en español.
z.config(z.locales.es());

export { z };

/** DNI tal como lo escribe la gente: acepta puntos y espacios y devuelve solo los números. */
export const dni = (mensaje = "El documento es obligatorio y debe tener solo números") =>
  z
    .string({ error: mensaje })
    .transform((v) => v.replace(/[.\s]/g, "").trim())
    .pipe(z.string().regex(/^\d+$/, mensaje));

/** Entero mayor a 0 que puede venir como texto (query, params). */
export const idPositivo = (mensaje = "Tiene que ser un número mayor a 0") =>
  z.coerce.number({ error: mensaje }).int(mensaje).positive(mensaje);
