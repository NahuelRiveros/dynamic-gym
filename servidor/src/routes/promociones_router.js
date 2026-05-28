import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { enviarEmailsMasivos } from "../services/email_service.js";
import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export const promocionesRouter = Router();

// Solo admins
promocionesRouter.use(requireAuth, requireRole("admin"));

// ── Query base: alumnos según filtro ─────────────────────────────────────────
const FILTROS = {
  todos:      "",
  activos:    "AND a.gym_alumno_rela_estadoalumno = 1",
  vencidos:   "AND a.gym_alumno_rela_estadoalumno != 1",
  con_plan:   `AND EXISTS (
                  SELECT 1 FROM gym_plan_alumno p
                  WHERE p.gym_planalu_rela_alumno = a.gym_alumno_id
                    AND p.gym_fecha_fin >= CURRENT_DATE
               )`,
  sin_plan:   `AND NOT EXISTS (
                  SELECT 1 FROM gym_plan_alumno p
                  WHERE p.gym_planalu_rela_alumno = a.gym_alumno_id
                    AND p.gym_fecha_fin >= CURRENT_DATE
               )`,
};

async function obtenerDestinatarios(filtro = "todos") {
  const where = FILTROS[filtro] ?? "";
  const rows = await sequelize.query(
    `SELECT
       p.gym_persona_nombre    AS nombre,
       p.gym_persona_apellido  AS apellido,
       p.gym_persona_email     AS email,
       p.gym_persona_celular   AS celular
     FROM gym_alumno a
     JOIN gym_persona p ON p.gym_persona_id = a.gym_alumno_rela_persona
     WHERE p.gym_persona_email IS NOT NULL
       AND p.gym_persona_email <> ''
       ${where}
     ORDER BY p.gym_persona_apellido, p.gym_persona_nombre`,
    { type: QueryTypes.SELECT }
  );
  return rows;
}

// ── GET /api/promociones/preview?filtro=todos ────────────────────────────────
// Devuelve cuántos alumnos recibirían el email según el filtro
promocionesRouter.get("/preview", async (req, res, next) => {
  try {
    const filtro = req.query.filtro || "todos";
    if (!FILTROS.hasOwnProperty(filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const destinatarios = await obtenerDestinatarios(filtro);
    return res.json({
      ok: true,
      total: destinatarios.length,
      muestra: destinatarios.slice(0, 5).map((d) => ({
        nombre:   `${d.nombre} ${d.apellido}`,
        email:    d.email,
      })),
    });
  } catch (err) { next(err); }
});

// ── GET /api/promociones/numeros?filtro=todos ────────────────────────────────
// Devuelve lista de celulares para armar lista de difusión de WhatsApp
promocionesRouter.get("/numeros", async (req, res, next) => {
  try {
    const filtro = req.query.filtro || "todos";
    if (!FILTROS.hasOwnProperty(filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const where = FILTROS[filtro] ?? "";
    const rows = await sequelize.query(
      `SELECT
         p.gym_persona_nombre    AS nombre,
         p.gym_persona_apellido  AS apellido,
         p.gym_persona_celular   AS celular
       FROM gym_alumno a
       JOIN gym_persona p ON p.gym_persona_id = a.gym_alumno_rela_persona
       WHERE p.gym_persona_celular IS NOT NULL
         ${where}
       ORDER BY p.gym_persona_apellido`,
      { type: QueryTypes.SELECT }
    );

    const numeros = rows
      .map((r) => String(r.celular).replace(/\D/g, ""))
      .filter((n) => n.length >= 8);

    return res.json({ ok: true, total: numeros.length, numeros });
  } catch (err) { next(err); }
});

// ── POST /api/promociones/enviar ─────────────────────────────────────────────
// Body: { filtro, subject, html }
promocionesRouter.post("/enviar", async (req, res, next) => {
  try {
    const { filtro = "todos", subject, html } = req.body ?? {};

    if (!subject?.trim() || !html?.trim()) {
      return res.status(400).json({ ok: false, mensaje: "Requerido: subject y html" });
    }
    if (!FILTROS.hasOwnProperty(filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }

    const destinatarios = await obtenerDestinatarios(filtro);
    if (destinatarios.length === 0) {
      return res.json({ ok: true, enviados: 0, fallidos: [], mensaje: "No hay destinatarios con email" });
    }

    const lista = destinatarios.map((d) => ({
      email:  d.email,
      nombre: `${d.nombre} ${d.apellido}`.trim(),
    }));

    const resultado = await enviarEmailsMasivos({ destinatarios: lista, subject, html });

    return res.json({
      ok:       true,
      enviados: resultado.enviados,
      fallidos: resultado.fallidos,
      total:    resultado.total,
      mensaje:  `${resultado.enviados} email(s) enviados correctamente`,
    });
  } catch (err) {
    if (err.message?.includes("SMTP no configurado")) {
      return res.status(400).json({ ok: false, mensaje: err.message });
    }
    next(err);
  }
});
