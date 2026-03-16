import { Router } from "express";
import { loginController, meController, logoutController } from "../controllers/auth_controller.js";
import { requireAuth } from "../middleware/auth_middleware.js";
import { seedAdmin, seedStaff } from "../controllers/auth_seed_controller.js";

export const authRouter = Router();

authRouter.post("/seed-admin", seedAdmin); 
authRouter.post("/seed-staff", seedStaff);
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
