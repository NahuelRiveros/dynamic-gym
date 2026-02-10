import {Router} from "express";
import {registrarIngreso} from "../controllers/ingreso_controller.js" 
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

export const ingresoRouter = Router();

ingresoRouter.use(requireAuth,requireRole("staff","admin"));
ingresoRouter.post("/registrar", registrarIngreso);