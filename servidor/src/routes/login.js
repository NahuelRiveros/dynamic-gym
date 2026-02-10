import { Router } from "express";
import { testRoles } from "../controllers/auth_controller.js";

export const testRouter = Router();
testRouter.get("/roles", testRoles);
