import "dotenv/config.js";

const esProduccion = process.env.NODE_ENV === "production";

/**
 * Verifica variables críticas en producción.
 * En desarrollo devuelve el valor por defecto si no está seteada.
 */
function requerirEnProd(nombre, defaultDev = "") {
  const valor = process.env[nombre];

  if (!valor) {
    if (esProduccion) {
      console.error(`\n❌  Variable de entorno REQUERIDA faltante: "${nombre}"`);
      console.error(`    Configurala en el panel de Render → Environment.\n`);
      process.exit(1);
    }
    return defaultDev;
  }

  return valor;
}

export const env = {
  PORT:     process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // ── Base de datos ──────────────────────────────────────────────
  // Render provee DATABASE_URL automáticamente.
  // En local usá las variables individuales en servidor/.env
  DATABASE_URL: process.env.DATABASE_URL || "",
  DB_HOST:      process.env.DB_HOST      || "localhost",
  DB_PORT:      Number(process.env.DB_PORT || 5432),
  DB_NAME:      process.env.DB_NAME      || "dynamicgym",
  DB_USER:      process.env.DB_USER      || "postgres",
  DB_PASS:      process.env.DB_PASS      || "",          // ← NUNCA hardcodear
  DB_SSL:       String(process.env.DB_SSL || "").toLowerCase() === "true",

  // ── Seguridad ──────────────────────────────────────────────────
  // En producción es OBLIGATORIO. En dev usa el valor del .env local.
  JWT_SECRET:   requerirEnProd("JWT_SECRET", "DEV_SECRET_SOLO_LOCAL_NO_USAR_EN_PROD"),

  // ── CORS ───────────────────────────────────────────────────────
  // Ejemplo: "https://mi-gym.onrender.com"
  // Dejarlo vacío = permite todos los orígenes (OK si el front vive en el mismo servidor)
  CORS_ORIGIN:  process.env.CORS_ORIGIN || "",
};