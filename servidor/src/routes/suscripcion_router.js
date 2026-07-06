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
 * Rutas protegidas por SEED_SECRET (solo Nahuel vía Postman):
 *   POST /api/suscripcion/setup           — crea tablas + suscripcion inicial
 *   POST /api/suscripcion/admin/extender  — agrega N días al vencimiento
 *   POST /api/suscripcion/admin/fijar     — fija una fecha de vencimiento exacta
 *   GET  /api/suscripcion/admin/estado    — lee estado sin necesitar login
 */

import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { env } from "../configuracion_servidor/env.js";
import {
  setupTablas,
  crearSuscripcionInicial,
  obtenerEstado,
  extenderSuscripcion,
  fijarFechaVencimiento,
  registrarPago,
  historialPagos,
} from "../services/software_suscripcion_service.js";
import {
  crearPreferencia,
  verificarPago,
} from "../services/mercadopago_service.js";
import { invalidarCacheSuscripcion } from "../middleware/suscripcion_middleware.js";

export const suscripcionRouter = Router();

// ── Setup (una sola vez por instalación) ─────────────────────────────────────
suscripcionRouter.post("/setup", async (req, res, next) => {
  try {
    const token = req.headers["x-seed-token"];
    if (!env.SEED_SECRET || token !== env.SEED_SECRET) {
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }
    await setupTablas();
    const r = await crearSuscripcionInicial();
    return res.json(r);
  } catch (err) {
    next(err);
  }
});

// ── Estado actual ─────────────────────────────────────────────────────────────
suscripcionRouter.get(
  "/estado",
  requireAuth, requireRole("admin"),
  async (_req, res, next) => {
    try {
      const estado = await obtenerEstado();
      return res.json(estado);
    } catch (err) {
      next(err);
    }
  }
);

// ── Crear preferencia de pago ─────────────────────────────────────────────────
suscripcionRouter.post(
  "/crear-pago",
  requireAuth, requireRole("admin"),
  async (_req, res, next) => {
    try {
      const estado = await obtenerEstado();
      if (!estado.ok) return res.status(400).json(estado);

      const pref = await crearPreferencia({
        suscripcionId: estado.id,
        monto:         estado.precio,
        clienteNombre: estado.cliente_nombre,
      });

      return res.json({ ok: true, ...pref });
    } catch (err) {
      // Error de configuración (MP_ACCESS_TOKEN faltante, etc.)
      if (err.message?.includes("MP_ACCESS_TOKEN") || err.message?.includes("SOFTWARE_PRECIO")) {
        return res.status(400).json({ ok: false, mensaje: err.message });
      }
      next(err);
    }
  }
);

// ── Webhook de MercadoPago (público) ──────────────────────────────────────────
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

    // ── Pago aprobado ── extender suscripción 30 días
    const hoy  = new Date();
    const hasta = new Date(hoy);
    hasta.setDate(hasta.getDate() + 30);

    const [saveResult, extResult] = await Promise.allSettled([
      registrarPago({
        mpPaymentId:    paymentId,
        mpPreferenceId: pago.external_reference,
        monto:          pago.monto,
        estado:         "aprobado",
        detalle:        pago.detalle,
        desde:          hoy.toISOString().slice(0, 10),
        hasta:          hasta.toISOString().slice(0, 10),
      }),
      extenderSuscripcion(30),
    ]);

    if (saveResult.status === "rejected") {
      console.log("  ℹ  Pago duplicado ignorado:", paymentId);
    } else {
      console.log(`  ✅ Suscripción extendida 30 días por pago ${paymentId}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook MP:", err.message);
    // Siempre responder 200 a MP para que no reintente indefinidamente
    return res.sendStatus(200);
  }
});

// ── Historial de pagos ────────────────────────────────────────────────────────
suscripcionRouter.get(
  "/pagos",
  requireAuth, requireRole("admin"),
  async (_req, res, next) => {
    try {
      const pagos = await historialPagos(24);
      return res.json({ ok: true, pagos });
    } catch (err) {
      next(err);
    }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  RUTAS SUPER_ADMIN — requieren JWT + rol super_admin
//  Sin SEED_SECRET: usan el token de sesión normal
// ════════════════════════════════════════════════════════════════════════════

// GET /api/suscripcion/super/estado
suscripcionRouter.get(
  "/super/estado",
  requireAuth, requireRole("super_admin"),
  async (_req, res, next) => {
    try {
      const estado = await obtenerEstado();
      return res.json(estado);
    } catch (err) { next(err); }
  }
);

// POST /api/suscripcion/super/extender   Body: { "dias": 30 }
suscripcionRouter.post(
  "/super/extender",
  requireAuth, requireRole("super_admin"),
  async (req, res, next) => {
    try {
      const dias = Number(req.body?.dias);
      if (!dias || dias <= 0 || dias > 3650) {
        return res.status(400).json({ ok: false, mensaje: "Enviá { \"dias\": N } con N entre 1 y 3650" });
      }
      const r = await extenderSuscripcion(dias);
      invalidarCacheSuscripcion();
      return res.json({ ok: true, mensaje: `Plan extendido ${dias} día(s)`, nuevo_vencimiento: r.nuevo_vencimiento });
    } catch (err) { next(err); }
  }
);

// POST /api/suscripcion/super/fijar   Body: { "fecha": "YYYY-MM-DD" }
suscripcionRouter.post(
  "/super/fijar",
  requireAuth, requireRole("super_admin"),
  async (req, res, next) => {
    try {
      const fecha = req.body?.fecha;
      if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return res.status(400).json({ ok: false, mensaje: "Enviá { \"fecha\": \"YYYY-MM-DD\" }" });
      }
      const r = await fijarFechaVencimiento(fecha);
      invalidarCacheSuscripcion();
      return res.json({ ok: true, mensaje: `Vencimiento fijado al ${fecha}`, nuevo_vencimiento: r.nuevo_vencimiento });
    } catch (err) { next(err); }
  }
);

// ════════════════════════════════════════════════════════════════════════════
//  RUTAS DE ADMINISTRACIÓN — solo Nahuel (protegidas por SEED_SECRET)
//  Usar vía Postman con header:  x-seed-token: <SEED_SECRET>
// ════════════════════════════════════════════════════════════════════════════

function verificarSeedToken(req, res) {
  const token = req.headers["x-seed-token"];
  if (!env.SEED_SECRET || token !== env.SEED_SECRET) {
    res.status(403).json({ ok: false, mensaje: "Token de administración inválido" });
    return false;
  }
  return true;
}

// ── Ver estado sin login ──────────────────────────────────────────────────────
// GET /api/suscripcion/admin/estado
suscripcionRouter.get("/admin/estado", async (req, res, next) => {
  try {
    if (!verificarSeedToken(req, res)) return;
    const estado = await obtenerEstado();
    return res.json(estado);
  } catch (err) { next(err); }
});

// ── Extender N días a partir del vencimiento actual ───────────────────────────
// POST /api/suscripcion/admin/extender
// Body: { "dias": 30 }
suscripcionRouter.post("/admin/extender", async (req, res, next) => {
  try {
    if (!verificarSeedToken(req, res)) return;

    const dias = Number(req.body?.dias);
    if (!dias || dias <= 0 || dias > 365) {
      return res.status(400).json({
        ok: false,
        mensaje: "Enviá { \"dias\": N } con N entre 1 y 365",
      });
    }

    const r = await extenderSuscripcion(dias);
    invalidarCacheSuscripcion();
    return res.json({
      ok: true,
      mensaje: `Plan extendido ${dias} día(s)`,
      nuevo_vencimiento: r.nuevo_vencimiento,
    });
  } catch (err) { next(err); }
});

// ── Fijar fecha de vencimiento exacta (para pruebas o casos especiales) ───────
// POST /api/suscripcion/admin/fijar
// Body: { "fecha": "2026-12-31" }
suscripcionRouter.post("/admin/fijar", async (req, res, next) => {
  try {
    if (!verificarSeedToken(req, res)) return;

    const fecha = req.body?.fecha;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Enviá { \"fecha\": \"YYYY-MM-DD\" }",
      });
    }

    const { sequelize } = await import("../database/sequelize.js");
    const { QueryTypes } = await import("sequelize");

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
  } catch (err) { next(err); }
});
