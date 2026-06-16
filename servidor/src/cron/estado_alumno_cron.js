import cron from "node-cron";
import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";

export function iniciarCronEstadoAlumnos() {
  // Cada 10 minutos
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("⏰ Ejecutando actualización automática de estados...");

      const r = await actualizarEstadosAlumnosAutomatico({
        fuente: "AUTO_CRON",
      });

      console.log(`✔ Estados actualizados. Cambios: ${r.total_cambios}`);
    } catch (err) {
      console.error("❌ Error en cron estado alumnos:", err);
    }
  });

  console.log("🟢 Cron de estados de alumnos iniciado (cada 10 minutos)");
}