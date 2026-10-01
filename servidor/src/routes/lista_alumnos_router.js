import { Router } from "express";
import { listaAlumnos , detalleAlumno , alumnosCumples} from "../controllers/lista_alumnos_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const listaAlumnosRouter = Router ();

const textoOpcional = () => z.string().trim().optional().transform((v) => v || null);
// "1/true/si" → true, "0/false/no" → false; cualquier otra cosa (o nada) → sin filtro.
const booleanoOpcional = () =>
  z.string().optional().transform((v) => {
    const s = String(v ?? "").trim().toLowerCase();
    if (["1", "true", "si", "sí", "yes"].includes(s)) return true;
    if (["0", "false", "no"].includes(s)) return false;
    return null;
  });
// Número entero o un valor por defecto si no vino o no es válido (como antes: nunca falla el listado).
const enteroOr = (porDefecto) =>
  z.unknown().optional().transform((v) => {
    const n = Number(v);
    return v != null && v !== "" && Number.isFinite(n) ? Math.trunc(n) : porDefecto;
  });

const listadoSchema = z.object({
  q: textoOpcional(),
  dni: textoOpcional(),
  estado_id: enteroOr(null),
  plan_vigente: booleanoOpcional(),
  page: enteroOr(1).transform((n) => Math.max(1, n)),
  limit: enteroOr(20).transform((n) => Math.min(100, Math.max(1, n))),
  // El servicio solo acepta columnas de su lista blanca (sortMap); cualquier otra ordena por apellido.
  sort: z.string().optional().default("apellido"),
  order: z.string().optional().transform((v) => (String(v ?? "").toLowerCase() === "asc" ? "asc" : "desc")),
});

const cumplesSchema = z.object({
  dias: enteroOr(30),
  incluirMes: z.string().optional().transform((v) => v === "true"),
});

listaAlumnosRouter.use(requireAuth,requireRole("staff","admin"));
listaAlumnosRouter.get("/listado", validar({ query: listadoSchema }), listaAlumnos);
listaAlumnosRouter.get("/detalle/:id", validar({ params: z.object({ id: idPositivo("id inválido") }) }), detalleAlumno);
listaAlumnosRouter.get("/cumples", validar({ query: cumplesSchema }), alumnosCumples);
