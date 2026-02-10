import { Sequelize } from "sequelize";
import { env } from "../configuracion_servidor/env.js";

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: "postgres",
  logging: false // ponelo en true si querés ver SQL
});
