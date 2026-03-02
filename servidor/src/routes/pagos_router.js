import { Router } from "express";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { registrarPago, previewPago } from "../controllers/pagos_controller.js";
export const pagosRouter = Router();

pagosRouter.use(requireAuth,requireRole("staff","admin"));
pagosRouter.post("/registrar", registrarPago);
pagosRouter.get("/preview", previewPago); 