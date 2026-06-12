import { Sequelize } from "sequelize";
import { env } from "../configuracion_servidor/env.js";

const dialectOptions = {
  // Establece search_path en cada nueva conexión antes de cualquier query
  options: "-c search_path=gym_v3,public",
  ...(env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {}),
};

// ── Pool de conexiones ────────────────────────────────────────────────────
// Evita abrir/cerrar la DB en cada request.
// En Render free tier el DB tiene límite de 25 conexiones → max: 5 es seguro.
const poolConfig = {
  max: 5,
  min: 1,
  acquire: 30000,
  idle: 10000,
};

const baseConfig = {
  dialect: "postgres",
  logging: false,
  dialectOptions,
  pool: poolConfig,
};

export const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, baseConfig)
  : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
      ...baseConfig,
      host: env.DB_HOST,
      port: env.DB_PORT,
    });

export async function conectarDB() {
  try {
    await sequelize.authenticate();
    await sequelize.query(`SET TIME ZONE 'America/Argentina/Cordoba'`);
    console.log("✅ Base de datos conectada");
  } catch (error) {
    console.error("❌ Error al conectar la base de datos:", error);
    throw error;
  }
}