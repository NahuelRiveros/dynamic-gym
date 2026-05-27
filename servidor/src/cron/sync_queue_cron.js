/**
 * sync_queue_cron.js
 *
 * Cron que intenta sincronizar los ingresos guardados en la cola offline
 * cada 30 segundos. Si la DB sigue sin conexión, los ítems se dejan como
 * "pendiente" para el próximo intento.
 */

import cron from "node-cron";
import {
  obtenerPendientes,
  marcarComoSincronizado,
  marcarComoErrorPermanente,
  contarPendientes,
} from "../services/offline_queue_service.js";
import { registrarIngresoPorDni } from "../services/ingresos_service.js";

let _sincronizando = false;

/**
 * Procesa los ítems pendientes de la cola.
 * Se puede llamar manualmente (p.ej. en un endpoint de diagnóstico).
 */
export async function sincronizarColaPendiente() {
  if (_sincronizando) return { saltado: true };

  const pendientes = obtenerPendientes();
  if (pendientes.length === 0) return { pendientes: 0, sincronizados: 0, errores: 0 };

  _sincronizando = true;
  console.log(`🔄 Sync offline: procesando ${pendientes.length} ingreso(s) pendiente(s)...`);

  let sincronizados = 0;
  let errores       = 0;

  for (const item of pendientes) {
    try {
      const resultado = await registrarIngresoPorDni({
        dni:      item.dni,
        fecha:    item.fecha_ingreso,
        hora:     item.hora_ingreso,
        modoSync: true,           // los errores de conexión se propagan (no re-encolan)
      });

      if (resultado.ok && !resultado.offline) {
        // ✓ Ingreso registrado exitosamente en la DB
        marcarComoSincronizado(item.id);
        sincronizados++;
        console.log(
          `  ✓ Sincronizado  DNI ${item.dni}  (${item.fecha_ingreso} ${item.hora_ingreso})`
        );

      } else if (!resultado.ok) {
        // ✗ Error de negocio (alumno no existe, plan vencido, sin ingresos, etc.)
        // → no tiene sentido reintentar, se marca como error permanente
        marcarComoErrorPermanente(item.id, resultado.mensaje);
        errores++;
        console.warn(
          `  ✗ Error permanente DNI ${item.dni}: ${resultado.mensaje}`
        );
      }

    } catch (err) {
      // Error de conexión — la DB sigue sin responder.
      // Dejamos el ítem como "pendiente" y abortamos el resto del lote
      // (todos fallarán igual si no hay conexión).
      console.log(
        `  ⏳ Sin conexión todavía — reintentando en el próximo ciclo.`
      );
      break;
    }
  }

  _sincronizando = false;

  if (sincronizados > 0 || errores > 0) {
    const restantes = contarPendientes();
    console.log(
      `  Sync completo: ${sincronizados} ok · ${errores} error(es) · ${restantes} pendiente(s)`
    );
  }

  return { pendientes: pendientes.length, sincronizados, errores };
}

/**
 * Inicia el cron de sincronización (cada 30 segundos).
 */
export function iniciarSyncQueueCron() {
  // En node-cron v3+, 6 campos = segundos habilitados.
  // "*/30 * * * * *" → dispara en el segundo 0 y 30 de cada minuto.
  cron.schedule("*/30 * * * * *", async () => {
    try {
      await sincronizarColaPendiente();
    } catch (err) {
      console.error("❌ Error en cron sync offline:", err);
    }
  });

  console.log("🟢 Cron de sincronización offline iniciado (cada 30 s)");
}
