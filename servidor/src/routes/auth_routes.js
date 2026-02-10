import { Router } from "express";
import { loginController, meController, logoutController } from "../controllers/auth_controller.js";
import { requireAuth } from "../middleware/auth_middleware.js";
import { seedAdmin } from "../controllers/auth_seed_controller.js";

export const authRouter = Router();

authRouter.post("/seed-admin", seedAdmin); // ✅ solo dev (luego lo borrás)
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
