import { Router } from "express";

import {
  AlumnosNuevos,
  VencimientosProximos7Dias,
  Asistencias,
  AsistenciasHoras,
  AsistenciasHorasDia,
  PlanesPopulares,
} from "../controllers/estadisticas_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";

export const estadisticasRouter = Router();

// Devuelven nombres y DNI de alumnos: solo admin (las pantallas que las usan también son solo admin).
estadisticasRouter.use(requireAuth, requireRole("admin"));

/**
 * =========================
 * ALUMNOS
 * =========================
 */
estadisticasRouter.get("/alumnos_Nuevos", AlumnosNuevos);

/**
 * =========================
 * VENCIMIENTOS
 * =========================
 */
estadisticasRouter.get("/vencimientos", VencimientosProximos7Dias);

/**
 * =========================
 * ASISTENCIAS
 * =========================
 */
estadisticasRouter.get("/asistencias", Asistencias);

/**
 * =========================
 * ASISTENCIAS POR HORA
 * =========================
 */
estadisticasRouter.get("/asistencias_horas", AsistenciasHoras);

/**
 * =========================
 * ASISTENCIAS HEATMAP
 * =========================
 */
estadisticasRouter.get("/asistencias_horas_dia", AsistenciasHorasDia);

/**
 * =========================
 * PLANES MÁS POPULARES
 * =========================
 */
estadisticasRouter.get("/planes-populares", PlanesPopulares);
