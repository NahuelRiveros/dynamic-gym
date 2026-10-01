// Registro local de ingresos rechazados en el kiosco (se ve con 5 clicks en el pie del kiosco).
export const KIOSK_LOG_KEY = "kiosk_log";
const LOG_MAX = 200;

export function guardarLogKiosk({ dni, codigo, mensaje }) {
  try {
    const log = JSON.parse(localStorage.getItem(KIOSK_LOG_KEY) || "[]");
    log.unshift({
      ts: new Date().toISOString(),
      dni,
      codigo,
      mensaje,
    });
    if (log.length > LOG_MAX) log.splice(LOG_MAX);
    localStorage.setItem(KIOSK_LOG_KEY, JSON.stringify(log));
  } catch {
    // Sin localStorage (modo privado o lleno) el kiosco sigue funcionando, solo sin registro.
  }
}
