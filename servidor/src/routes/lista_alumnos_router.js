import { Router } from "express";
import { listaAlumnos , detalleAlumno} from "../controllers/lista_alumnos_controller.js";

export const listaAlumnosRouter = Router ();
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

listaAlumnosRouter.use(requireAuth,requireRole("staff","admin"));
listaAlumnosRouter.get("/listado", listaAlumnos);
listaAlumnosRouter.get("/detalle/:id", detalleAlumno);
