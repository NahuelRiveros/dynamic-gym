import { Router } from "express";
import { registrar } from "../controllers/persona_controller.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";

export const personasRouter = Router();
personasRouter.use(requireAuth,requireRole("staff","admin"));
personasRouter.post("/registrar", registrar);
