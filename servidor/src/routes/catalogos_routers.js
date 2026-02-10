import { Router } from "express";
import { catalogosController } from "../controllers/catalogos_controllers.js";

export const catalogosRouter = Router();

catalogosRouter.get("/", catalogosController);
