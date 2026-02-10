import { Router } from "express";
import { listaAlumnos} from "../controllers/lista_alumnos_controller.js";

export const listaAlumnosRouter = Router ();
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

listaAlumnosRouter.use(requireAuth,requireRole("staff","admin"));
listaAlumnosRouter.get("/", listaAlumnos);
