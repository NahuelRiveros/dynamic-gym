import cron from "node-cron";
import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";

export function iniciarCronEstadoAlumnos() {
  // Cada hora (en punto). Neon cobra por tiempo despierta y se duerme a los ~5 min sin consultas:
  // cada 10 minutos no la dejaba dormir nunca. El ingreso por DNI ya recalcula el estado del alumno
  // en el momento, así que el cron solo pone al día a los que no vinieron.
  cron.schedule("0 * * * *", async () => {
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

  console.log("🟢 Cron de estados de alumnos iniciado (cada hora)");
}