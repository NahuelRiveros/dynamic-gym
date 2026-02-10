import "dotenv/config.js";

export const env = {
  PORT: process.env.PORT || 4000,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_NAME: process.env.DB_NAME || "dynamicGym",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASS: process.env.DB_PASS || "25466178",
  JWT_SECRET : process.env.JWT_SECRET || "Maloki02"
};

