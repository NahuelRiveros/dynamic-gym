import { Router } from "express";

import {
  AlumnosNuevos,
  VencimientosProximos7Dias,
  Asistencias,
  AsistenciasHoras,
  AsistenciasHorasDia,
  PlanesPopulares,
} from "../controllers/estadisticas_controller.js";

export const estadisticasRouter = Router();

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
