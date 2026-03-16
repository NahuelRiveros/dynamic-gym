import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { ActualizarEstadosAutomatico } from "../controllers/estado_alumno_auto_controller.js";

export const adminAlumnosRouter = Router();

adminAlumnosRouter.use(requireAuth, requireRole("staff","admin"));
adminAlumnosRouter.post("/actualizar-estados", ActualizarEstadosAutomatico);