import "dotenv/config.js";

export const env = {
  PORT: process.env.PORT || 4000,

  // Para PROD (Render) recomendado
  DATABASE_URL: process.env.DATABASE_URL || "",

  // Para LOCAL (o si no querés DATABASE_URL)
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_NAME: process.env.DB_NAME || "dynamicGym",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASS: process.env.DB_PASS || "25466178",

  // Seguridad
  JWT_SECRET: process.env.JWT_SECRET || "Maloki02",

  // Control SSL (Render true, local false)
  DB_SSL: String(process.env.DB_SSL || "").toLowerCase() === "true",
};