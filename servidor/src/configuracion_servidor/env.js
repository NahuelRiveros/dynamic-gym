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
  // DATABASE_URL1: si está seteada, tiene prioridad (útil para migrar a Neon
  // sin downtime — una vez verificado, renombrá a DATABASE_URL y borrá esta).
  DATABASE_URL: process.env.DATABASE_URL1 || process.env.DATABASE_URL || "",
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

  // ── Seed secret ────────────────────────────────────────────────
  SEED_SECRET:  process.env.SEED_SECRET || "",

  // ── MercadoPago (suscripción al software) ──────────────────────
  // Obtenelo en https://www.mercadopago.com.ar/developers/panel/app
  // Sandbox: usa el token de TEST para pruebas, PROD para producción.
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || "",

  // URL COMPLETA del backend (para que MP envíe el webhook).
  // Ejemplo: "https://dynamic-gym.onrender.com"
  // En local: dejar vacío (el webhook no llegará, pero el flujo funciona).
  APP_URL: process.env.APP_URL || "",

  // URL COMPLETA del frontend (para la redirección post-pago de MP).
  // Ejemplo: "https://dynamic-gym.vercel.app"
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  // ── Plan del software ──────────────────────────────────────────
  // Precio mensual en ARS (sin centavos). Ej: 10000 = $10.000
  SOFTWARE_PRECIO: Number(process.env.SOFTWARE_PRECIO || 0),
  // Nombre visible del cliente / gimnasio en la factura MP.
  SOFTWARE_CLIENTE: process.env.SOFTWARE_CLIENTE || "Dynamic Gym",

  // ── Email / SMTP ───────────────────────────────────────────────
  SMTP_HOST:   process.env.SMTP_HOST   || "smtp.gmail.com",
  SMTP_PORT:   Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
  SMTP_USER:   process.env.SMTP_USER   || "",
  SMTP_PASS:   process.env.SMTP_PASS   || "",
  SMTP_FROM:   process.env.SMTP_FROM   || "",
};