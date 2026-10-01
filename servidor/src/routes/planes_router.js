import { Router } from "express";
import {
  listarPlanesController,
  obtenerPlanPorIdController,
  crearPlanController,
  actualizarPlanController,
  cambiarEstadoPlanController,
} from "../controllers/planes_controllers.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const planesRouter = Router();

const conId = { params: z.object({ id: idPositivo("id inválido") }) };
const estadoSchema = z.object({ activo: z.boolean({ error: "El campo activo debe ser booleano" }) });

// Lectura: admin y staff
planesRouter.get("/",    requireAuth, requireRole("admin", "staff"), listarPlanesController);
planesRouter.get("/:id", requireAuth, requireRole("admin", "staff"), validar(conId), obtenerPlanPorIdController);

// Escritura: solo admin
planesRouter.post("/",           requireAuth, requireRole("admin"), crearPlanController);
planesRouter.put("/:id",         requireAuth, requireRole("admin"), validar(conId), actualizarPlanController);
planesRouter.patch("/:id/estado",requireAuth, requireRole("admin"), validar({ ...conId, body: estadoSchema }), cambiarEstadoPlanController);
