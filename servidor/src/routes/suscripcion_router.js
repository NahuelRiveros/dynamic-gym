/**
 * suscripcion_router.js
 *
 * Endpoints de suscripción al software Dynamic Gym.
 *
 * Rutas autenticadas (admin):
 *   GET  /api/suscripcion/estado          — estado actual + días restantes
 *   POST /api/suscripcion/crear-pago      — crea preferencia MP y devuelve URL
 *   GET  /api/suscripcion/pagos           — historial de pagos
 *
 * Rutas públicas:
 *   POST /api/suscripcion/webhook         — callback de MercadoPago
 *
 * Rutas super_admin (sesión normal):
 *   GET  /api/suscripcion/super/estado | POST /super/extender | POST /super/fijar
 *
 * Rutas protegidas por SEED_SECRET (solo Nahuel vía Postman):
 *   POST /api/suscripcion/setup           — crea tablas + suscripcion inicial
 *   POST /api/suscripcion/admin/extender  — agrega N días al vencimiento
 *   POST /api/suscripcion/admin/fijar     — fija una fecha de vencimiento exacta
 *   GET  /api/suscripcion/admin/estado    — lee estado sin necesitar login
 */

import { Router } from "express";
import { QueryTypes } from "sequelize";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { requireSeedToken, seedLimiter } from "../middleware/seed_token.js";
import { sequelize } from "../database/sequelize.js";
import {
  setupTablas,
  crearSuscripcionInicial,
  obtenerEstado,
  extenderSuscripcion,
  acreditarPagoAprobado,
  fijarFechaVencimiento,
  fijarPrecio,
  registrarPago,
  historialPagos,
} from "../services/software_suscripcion_service.js";
import {
  crearPreferencia,
  verificarPago,
} from "../services/mercadopago_service.js";
import { invalidarCacheSuscripcion } from "../middleware/suscripcion_middleware.js";
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const suscripcionRouter = Router();

const conDias = (max) =>
  validar({
    body: z.object({
      dias: z.coerce
        .number({ error: `Enviá { "dias": N } con N entre 1 y ${max}` })
        .int(`Enviá { "dias": N } con N entre 1 y ${max}`)
        .min(1, `Enviá { "dias": N } con N entre 1 y ${max}`)
        .max(max, `Enviá { "dias": N } con N entre 1 y ${max}`),
    }),
  });
const conFecha = validar({
  body: z.object({ fecha: z.string({ error: "Enviá { \"fecha\": \"YYYY-MM-DD\" }" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Enviá { \"fecha\": \"YYYY-MM-DD\" }") }),
});
const soloSeed = [seedLimiter, requireSeedToken];

// ── Setup (una sola vez por instalación) ─────────────────────────────────────
suscripcionRouter.post("/setup", ...soloSeed, async (_req, res) => {
  await setupTablas();
  const r = await crearSuscripcionInicial();
  return res.json(r);
});

// ── Estado actual ─────────────────────────────────────────────────────────────
suscripcionRouter.get("/estado", requireAuth, requireRole("admin"), async (_req, res) => {
  const estado = await obtenerEstado();
  return res.json(estado);
});

// ── Crear preferencia de pago ─────────────────────────────────────────────────
// Si falta MP_ACCESS_TOKEN o SOFTWARE_PRECIO, mercadopago_service responde 400 con el detalle.
suscripcionRouter.post("/crear-pago", requireAuth, requireRole("admin"), async (_req, res) => {
  const estado = await obtenerEstado();
  if (!estado.ok) return res.status(400).json(estado);

  const pref = await crearPreferencia({
    suscripcionId: estado.id,
    monto:         estado.precio,
    clienteNombre: estado.cliente_nombre,
  });

  return res.json({ ok: true, ...pref });
});

// ── Webhook de MercadoPago (público) ──────────────────────────────────────────
// El try/catch se queda: a Mercado Pago siempre se le responde 200, aunque algo falle,
// para que no reintente indefinidamente.
suscripcionRouter.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body ?? {};

    // MP envía notificaciones de tipo "payment"
    if (type !== "payment" || !data?.id) {
      return res.sendStatus(200); // responder 200 para que MP no reintente
    }

    const paymentId = String(data.id);
    console.log(`📦 Webhook MP: pago ${paymentId}`);

    const pago = await verificarPago(paymentId);

    if (!pago.aprobado) {
      console.log(`  ⚠  Pago ${paymentId} no aprobado (${pago.estado})`);
      // Registrar igual para trazabilidad
      await registrarPago({
        mpPaymentId:    paymentId,
        mpPreferenceId: null,
        monto:          pago.monto,
        estado:         pago.estado,
        detalle:        pago.detalle,
      }).catch(() => {}); // ignorar duplicados
      return res.sendStatus(200);
    }

    // ── Pago aprobado ── extender suscripción 30 días (una sola vez por pago)
    const r = await acreditarPagoAprobado({ pago });
    if (r.codigo === "DUPLICADO") {
      console.log("  ℹ  Pago duplicado ignorado:", paymentId);
    } else {
      invalidarCacheSuscripcion();
      console.log(`  ✅ Suscripción extendida por pago ${paymentId}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook MP:", err.message);
    return res.sendStatus(200);
  }
});

// ── Historial de pagos ────────────────────────────────────────────────────────
suscripcionRouter.get("/pagos", requireAuth, requireRole("admin"), async (_req, res) => {
  const pagos = await historialPagos(24);
  return res.json({ ok: true, pagos });
});

// ════════════════════════════════════════════════════════════════════════════
//  RUTAS SUPER_ADMIN — requieren JWT + rol super_admin
// ════════════════════════════════════════════════════════════════════════════

suscripcionRouter.get("/super/estado", requireAuth, requireRole("super_admin"), async (_req, res) => {
  const estado = await obtenerEstado();
  return res.json(estado);
});

// Body: { "dias": 30 }
suscripcionRouter.post("/super/extender", requireAuth, requireRole("super_admin"), conDias(3650), async (req, res) => {
  const { dias } = req.datos.body;
  const r = await extenderSuscripcion(dias);
  invalidarCacheSuscripcion();
  return res.json({ ok: true, mensaje: `Plan extendido ${dias} día(s)`, nuevo_vencimiento: r.nuevo_vencimiento });
});

// Body: { "fecha": "YYYY-MM-DD" }
suscripcionRouter.post("/super/fijar", requireAuth, requireRole("super_admin"), conFecha, async (req, res) => {
  const { fecha } = req.datos.body;
  const r = await fijarFechaVencimiento(fecha);
  invalidarCacheSuscripcion();
  return res.json({ ok: true, mensaje: `Vencimiento fijado al ${fecha}`, nuevo_vencimiento: r.nuevo_vencimiento });
});

// Body: { "precio": 60000 } — en pesos, sin centavos.
const conPrecio = validar({
  body: z.object({
    precio: z.coerce
      .number({ error: "El precio tiene que ser un número" })
      .int("El precio va sin centavos")
      .min(1, "El precio tiene que ser mayor a 0")
      .max(10_000_000, "El precio parece demasiado alto"),
  }),
});
suscripcionRouter.post("/super/precio", requireAuth, requireRole("super_admin"), conPrecio, async (req, res) => {
  const r = await fijarPrecio(req.datos.body.precio);
  invalidarCacheSuscripcion();
  return res.status(r.ok ? 200 : 404).json(r.ok ? { ...r, mensaje: "Precio actualizado" } : r);
});

// ════════════════════════════════════════════════════════════════════════════
//  RUTAS DE ADMINISTRACIÓN — solo Nahuel (protegidas por SEED_SECRET)
//  Usar vía Postman con header:  x-seed-token: <SEED_SECRET>
// ════════════════════════════════════════════════════════════════════════════

suscripcionRouter.get("/admin/estado", ...soloSeed, async (_req, res) => {
  const estado = await obtenerEstado();
  return res.json(estado);
});

// Body: { "dias": 30 }
suscripcionRouter.post("/admin/extender", ...soloSeed, conDias(365), async (req, res) => {
  const { dias } = req.datos.body;
  const r = await extenderSuscripcion(dias);
  invalidarCacheSuscripcion();
  return res.json({ ok: true, mensaje: `Plan extendido ${dias} día(s)`, nuevo_vencimiento: r.nuevo_vencimiento });
});

// Body: { "fecha": "2026-12-31" }
suscripcionRouter.post("/admin/fijar", ...soloSeed, conFecha, async (req, res) => {
  const { fecha } = req.datos.body;

  await sequelize.query(
    `UPDATE software_suscripcion
     SET fecha_vencimiento = :fecha, actualizado_en = NOW()
     WHERE id = (SELECT id FROM software_suscripcion ORDER BY id LIMIT 1)`,
    { replacements: { fecha }, type: QueryTypes.UPDATE }
  );

  invalidarCacheSuscripcion();
  const estado = await obtenerEstado();
  return res.json({
    ok:      true,
    mensaje: `Vencimiento fijado a ${fecha}`,
    estado:  estado.estado,
    mensaje_estado: estado.mensaje,
  });
});
