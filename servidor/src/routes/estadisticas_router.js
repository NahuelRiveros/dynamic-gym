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
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const estadisticasRouter = Router();

// Primer y último día del mes actual (el rango por defecto de siempre).
function rangoMesActualISO() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { desde, hasta };
}

// Vacía (el campo de fecha borrado) = sin fecha → se usa el mes actual.
const fecha = (mensaje) =>
  z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, mensaje).refine((v) => !Number.isNaN(Date.parse(v)), mensaje).optional(),
  );

const conRango = validar({
  query: z
    .object({
      desde: fecha("desde tiene que ser una fecha AAAA-MM-DD"),
      hasta: fecha("hasta tiene que ser una fecha AAAA-MM-DD"),
    })
    .transform(({ desde, hasta }) => {
      const mes = rangoMesActualISO();
      return { desde: desde ?? mes.desde, hasta: hasta ?? mes.hasta };
    }),
});

const conDias = validar({
  query: z.object({ dias: z.coerce.number().int().min(0).max(365).optional().default(7) }),
});

const conAnio = validar({
  query: z.object({
    anio: z.coerce.number().int().min(2000, "Año inválido").max(2100, "Año inválido").optional().default(() => new Date().getFullYear()),
  }),
});

// Devuelven nombres y DNI de alumnos: solo admin (las pantallas que las usan también son solo admin).
estadisticasRouter.use(requireAuth, requireRole("admin"));

estadisticasRouter.get("/alumnos_Nuevos", conRango, AlumnosNuevos);
estadisticasRouter.get("/vencimientos", conDias, VencimientosProximos7Dias);
estadisticasRouter.get("/asistencias", conRango, Asistencias);
estadisticasRouter.get("/asistencias_horas", conRango, AsistenciasHoras);
estadisticasRouter.get("/asistencias_horas_dia", conRango, AsistenciasHorasDia); // heatmap
estadisticasRouter.get("/planes-populares", conAnio, PlanesPopulares);
