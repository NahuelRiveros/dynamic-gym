import { Sequelize } from "sequelize";
import { env } from "../configuracion_servidor/env.js";

const sslOptions = env.DB_SSL
  ? { ssl: { require: true, rejectUnauthorized: false } }
  : {};

export const sequelize = env.DATABASE_URL
  ? new Sequelize(env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: sslOptions,
    })
  : new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
      host: env.DB_HOST,
      port: env.DB_PORT,
      dialect: "postgres",
      logging: false,
      dialectOptions: sslOptions,
    });