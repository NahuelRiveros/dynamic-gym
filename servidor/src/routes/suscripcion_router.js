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
 * Ruta protegida por SEED_SECRET:
 *   POST /api/suscripcion/setup           — crea tablas + suscripcion inicial
 */

import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { env } from "../configuracion_servidor/env.js";
import {
  setupTablas,
  crearSuscripcionInicial,
  obtenerEstado,
  extenderSuscripcion,
  registrarPago,
  historialPagos,
} from "../services/software_suscripcion_service.js";
import {
  crearPreferencia,
  verificarPago,
} from "../services/mercadopago_service.js";

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
