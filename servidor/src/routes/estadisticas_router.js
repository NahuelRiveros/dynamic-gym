import { Router } from "express";
import {
  RecaudacionMensual,
  AlumnosNuevos,
  VencimientosProximos7Dias,
  Asistencias,
  AsistenciasHoras,
  AsistenciasHorasDia,
  RecaudacionDiariaMes,
} from "../controllers/estadisticas_controller.js";
import { requireAuth , requireRole} from "../middleware/auth_middleware.js";

export const estadisticasRouter = Router();
estadisticasRouter.use(requireAuth,requireRole("admin"))
estadisticasRouter.get("/recaudaciones", RecaudacionMensual);
estadisticasRouter.get("/recaudaciones_diaria", RecaudacionDiariaMes);
estadisticasRouter.get("/alumnos_Nuevos", AlumnosNuevos);
estadisticasRouter.get("/vencimientos", VencimientosProximos7Dias);
estadisticasRouter.get("/asistencias", Asistencias);
estadisticasRouter.get("/asistencias_horas", AsistenciasHoras);
estadisticasRouter.get("/asistencias_horas_dia", AsistenciasHorasDia);
