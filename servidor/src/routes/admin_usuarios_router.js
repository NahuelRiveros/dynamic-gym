import { Router } from "express";
import { crearUsuarioController ,listarUsuariosController } from "../controllers/admin_usuarios_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

export const adminUsuariosRouter = Router();

// Solo admin: crear usuarios es dar acceso al sistema.
adminUsuariosRouter.use(requireAuth, requireRole("admin"));

adminUsuariosRouter.post("/", crearUsuarioController);
adminUsuariosRouter.get("/", listarUsuariosController);