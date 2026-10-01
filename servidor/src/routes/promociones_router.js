import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { enviarEmailsMasivos } from "../services/email_service.js";
import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const promocionesRouter = Router();

promocionesRouter.use(requireAuth, requireRole("admin"));

// Lista blanca: el filtro elegido se traduce a un pedazo de SQL fijo, nunca al texto que llega.
const FILTROS = {
  todos:    "",
  activos:  "AND a.estado_id = 1",
  vencidos: "AND a.estado_id != 1",
};
const filtro = () =>
  z.preprocess((v) => v || "todos", z.enum(Object.keys(FILTROS), { error: "Filtro inválido" }));

const conFiltro = validar({ query: z.object({ filtro: filtro() }) });
const envioSchema = z.object({
  filtro: filtro(),
  subject: z.string({ error: "Requerido: subject y html" }).trim().min(1, "Requerido: subject y html"),
  html: z.string({ error: "Requerido: subject y html" }).trim().min(1, "Requerido: subject y html"),
});

async function obtenerDestinatarios(filtroElegido) {
  return sequelize.query(
    `SELECT
       p.nombre    AS nombre,
       p.apellido  AS apellido,
       p.email     AS email,
       p.celular   AS celular
     FROM alumno a
     JOIN persona p ON p.id = a.persona_id
     WHERE p.email IS NOT NULL
       AND p.email <> ''
       ${FILTROS[filtroElegido]}
     ORDER BY p.apellido, p.nombre`,
    { type: QueryTypes.SELECT }
  );
}

promocionesRouter.get("/preview", conFiltro, async (req, res) => {
  const destinatarios = await obtenerDestinatarios(req.datos.query.filtro);
  return res.json({
    ok: true,
    total: destinatarios.length,
    muestra: destinatarios.slice(0, 5).map((d) => ({
      nombre: `${d.nombre} ${d.apellido}`,
      email:  d.email,
    })),
  });
});

promocionesRouter.get("/numeros", conFiltro, async (req, res) => {
  const rows = await sequelize.query(
    `SELECT
       p.nombre    AS nombre,
       p.apellido  AS apellido,
       p.celular   AS celular
     FROM alumno a
     JOIN persona p ON p.id = a.persona_id
     WHERE p.celular IS NOT NULL
       ${FILTROS[req.datos.query.filtro]}
     ORDER BY p.apellido`,
    { type: QueryTypes.SELECT }
  );

  const numeros = rows
    .map((r) => String(r.celular).replace(/\D/g, ""))
    .filter((n) => n.length >= 8);

  return res.json({ ok: true, total: numeros.length, numeros });
});

// Sin SMTP configurado, email_service responde 400 SMTP_NO_CONFIGURADO.
promocionesRouter.post("/enviar", validar({ body: envioSchema }), async (req, res) => {
  const { filtro: filtroElegido, subject, html } = req.datos.body;

  const destinatarios = await obtenerDestinatarios(filtroElegido);
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
});
