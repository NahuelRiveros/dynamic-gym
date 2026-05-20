import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import {
  ActualizarEstadosAutomatico,
  buscarPlanVigenteAlumno,
  actualizarPlanVigenteAlumno,
  actualizarPersonaAlumno,
} from "../controllers/estado_alumno_auto_controller.js";

export const adminAlumnosRouter = Router();

adminAlumnosRouter.use(requireAuth, requireRole("admin"));

adminAlumnosRouter.post("/actualizar-estados", ActualizarEstadosAutomatico);

// Buscar plan vigente por DNI
adminAlumnosRouter.get("/actualizar-plan", buscarPlanVigenteAlumno);

// Actualizar plan vigente
adminAlumnosRouter.put("/actualizar-plan", actualizarPlanVigenteAlumno);

// Actualizar datos personales del alumno
adminAlumnosRouter.patch("/actualizar-persona", actualizarPersonaAlumno);