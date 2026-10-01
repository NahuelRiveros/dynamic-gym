import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import {
  ActualizarEstadosAutomatico,
  buscarPlanVigenteAlumno,
  actualizarPlanVigenteAlumno,
  actualizarPersonaAlumno,
} from "../controllers/estado_alumno_auto_controller.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const adminAlumnosRouter = Router();

// El formato del DNI lo revisa el servicio (responde VALIDACION "Documento inválido").
const documento = () => z.string({ error: "documento es obligatorio" }).trim().min(1, "documento es obligatorio");
const fechaISO = (mensaje) => z.string({ error: mensaje }).regex(/^\d{4}-\d{2}-\d{2}$/, mensaje);
// Texto opcional: si no viene queda sin tocar (undefined); vacío o null lo borra.
const textoOpcional = () => z.union([z.string(), z.number()]).nullable().optional().transform((v) => (v == null ? v : String(v)));

const planSchema = z.object({
  documento: documento(),
  tipo_plan_id: idPositivo("tipo_plan_id debe ser número > 0"),
  fecha_inicio: fechaISO("fecha_inicio y fecha_fin son obligatorias (AAAA-MM-DD)"),
  fecha_fin: fechaISO("fecha_inicio y fecha_fin son obligatorias (AAAA-MM-DD)"),
  ingresos_disponibles: z.coerce.number().int().min(0, "ingresos_disponibles no puede ser negativo").nullable().optional().default(null),
});

const personaSchema = z.object({
  documento: documento(),
  nombre: z.string({ error: "nombre y apellido son obligatorios" }).trim().min(1, "nombre y apellido son obligatorios"),
  apellido: z.string({ error: "nombre y apellido son obligatorios" }).trim().min(1, "nombre y apellido son obligatorios"),
  nuevo_documento: textoOpcional(),
  celular: textoOpcional(),
  celular_emergencia: textoOpcional(),
  email: textoOpcional(),
  fecha_nacimiento: textoOpcional(),
});

adminAlumnosRouter.use(requireAuth, requireRole("admin"));

adminAlumnosRouter.post("/actualizar-estados", ActualizarEstadosAutomatico);

// Buscar plan vigente por DNI
adminAlumnosRouter.get("/actualizar-plan", validar({ query: z.object({ documento: documento() }) }), buscarPlanVigenteAlumno);

// Actualizar plan vigente
adminAlumnosRouter.put("/actualizar-plan", validar({ body: planSchema }), actualizarPlanVigenteAlumno);

// Actualizar datos personales del alumno
adminAlumnosRouter.patch("/actualizar-persona", validar({ body: personaSchema }), actualizarPersonaAlumno);
