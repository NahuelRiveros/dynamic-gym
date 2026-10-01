import { Router } from "express";
import { registrar } from "../controllers/persona_controller.js";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { dni, z } from "../nucleo/zod.js";

export const personasRouter = Router();

const textoOpcional = () => z.string().trim().optional().nullable().transform((v) => v || null);
// Vacío, null o sin mandar = sin dato (un select sin elegir manda "").
const idOpcional = () =>
  z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable());

// Solo los campos que guarda persona_service (nada de lo que venga de más llega a la base).
const registroSchema = z.object({
  nombre: z.string({ error: "nombre, apellido y documento son obligatorios" }).trim().min(1, "nombre, apellido y documento son obligatorios"),
  apellido: z.string({ error: "nombre, apellido y documento son obligatorios" }).trim().min(1, "nombre, apellido y documento son obligatorios"),
  documento: dni("El documento es obligatorio y debe tener solo números"),
  email: z.string().trim().toLowerCase().email("Email inválido").optional().nullable().or(z.literal("").transform(() => null)),
  fecha_nacimiento: textoOpcional(),
  celular: textoOpcional(),
  celular_emergencia: textoOpcional(),
  tipo_documento_id: idOpcional(),
  sexo_id: idOpcional(),
  tipo_persona_id: idOpcional(),
});

personasRouter.use(requireAuth,requireRole("staff","admin"));
personasRouter.post("/registrar", validar({ body: registroSchema }), registrar);
