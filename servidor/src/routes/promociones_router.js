import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { enviarEmailsMasivos } from "../services/email_service.js";
import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export const promocionesRouter = Router();

promocionesRouter.use(requireAuth, requireRole("admin"));

const FILTROS = {
  todos:    "",
  activos:  "AND a.estado_id = 1",
  vencidos: "AND a.estado_id != 1",
};

async function obtenerDestinatarios(filtro = "todos") {
  const where = FILTROS[filtro] ?? "";
  const rows = await sequelize.query(
    `SELECT
       p.nombre    AS nombre,
       p.apellido  AS apellido,
       p.email     AS email,
       p.celular   AS celular
     FROM alumno a
     JOIN persona p ON p.id = a.persona_id
     WHERE p.email IS NOT NULL
       AND p.email <> ''
       ${where}
     ORDER BY p.apellido, p.nombre`,
    { type: QueryTypes.SELECT }
  );
  return rows;
}

promocionesRouter.get("/preview", async (req, res, next) => {
  try {
    const filtro = req.query.filtro || "todos";
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const destinatarios = await obtenerDestinatarios(filtro);
    return res.json({
      ok: true,
      total: destinatarios.length,
      muestra: destinatarios.slice(0, 5).map((d) => ({
        nombre: `${d.nombre} ${d.apellido}`,
        email:  d.email,
      })),
    });
  } catch (err) { next(err); }
});

promocionesRouter.get("/numeros", async (req, res, next) => {
  try {
    const filtro = req.query.filtro || "todos";
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro)) {
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });
    }
    const where = FILTROS[filtro] ?? "";
    const rows = await sequelize.query(
      `SELECT
         p.nombre    AS nombre,
         p.apellido  AS apellido,
         p.celular   AS celular
       FROM alumno a
       JOIN persona p ON p.id = a.persona_id
       WHERE p.celular IS NOT NULL
         ${where}
       ORDER BY p.apellido`,
      { type: QueryTypes.SELECT }
    );

    const numeros = rows
      .map((r) => String(r.celular).replace(/\D/g, ""))
      .filter((n) => n.length >= 8);

    return res.json({ ok: true, total: numeros.length, numeros });
  } catch (err) { next(err); }
});

promocionesRouter.post("/enviar", async (req, res, next) => {
  try {
    const { filtro = "todos", subject, html } = req.body ?? {};

    if (!subject?.trim() || !html?.trim())
      return res.status(400).json({ ok: false, mensaje: "Requerido: subject y html" });
    if (!Object.prototype.hasOwnProperty.call(FILTROS, filtro))
      return res.status(400).json({ ok: false, mensaje: "Filtro inválido" });

    const destinatarios = await obtenerDestinatarios(filtro);
    if (destinatarios.length === 0)
      return res.json({ ok: true, enviados: 0, fallidos: [], mensaje: "No hay destinatarios con email" });

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
    if (err.message?.includes("SMTP no configurado"))
      return res.status(400).json({ ok: false, mensaje: err.message });
    next(err);
  }
});
