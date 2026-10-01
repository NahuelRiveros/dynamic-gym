import { Router } from "express";
import {
  RecaudacionMesesPorAnio,
  RecaudacionDiasDeMes,
  RecaudacionDetalleDia,
} from "../controllers/recaudacion_controller.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const recaudacionRouter = Router();

const anio = () => idPositivo("anio es obligatorio");
const mes = () => idPositivo("anio y mes son obligatorios (mes 1..12)").max(12, "anio y mes son obligatorios (mes 1..12)");
const dia = () => idPositivo("anio, mes y dia son obligatorios").max(31, "anio, mes y dia son obligatorios");

recaudacionRouter.use(requireAuth,requireRole("admin"));
recaudacionRouter.get("/mensual", validar({ query: z.object({ anio: anio() }) }), RecaudacionMesesPorAnio);
recaudacionRouter.get("/dias", validar({ query: z.object({ anio: anio(), mes: mes() }) }), RecaudacionDiasDeMes);
recaudacionRouter.get("/detalle-dia", validar({ query: z.object({ anio: anio(), mes: mes(), dia: dia() }) }), RecaudacionDetalleDia);
