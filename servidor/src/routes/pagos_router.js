import { Router } from "express";
import { registrarPago} from "../controllers/pagos_controller.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
export const pagosRouter = Router();

pagosRouter.use(requireAuth,requireRole("staff","admin"));
pagosRouter.post("/registrar", registrarPago);