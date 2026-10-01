import { Router } from "express";
import {
  listarStaffController,
  crearStaffController,
  actualizarStaffController,
  cambiarPasswordStaffController,
  cambiarEstadoStaffController,
} from "../controllers/admin_staff_controllers.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const staffRouter = Router();

const conUsuario = { params: z.object({ usuarioId: idPositivo("usuarioId inválido") }) };
const estadoSchema = z.object({ activo: z.boolean({ error: "El campo activo debe ser booleano" }) });

// Solo admin
staffRouter.use(requireAuth, requireRole("admin"));

staffRouter.get("/", listarStaffController);
staffRouter.post("/", crearStaffController);
staffRouter.put("/:usuarioId", validar(conUsuario), actualizarStaffController);
staffRouter.patch("/:usuarioId/password", validar(conUsuario), cambiarPasswordStaffController);
staffRouter.patch("/:usuarioId/estado", validar({ ...conUsuario, body: estadoSchema }), cambiarEstadoStaffController);
