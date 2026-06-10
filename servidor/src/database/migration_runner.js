import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { sequelize } from "./sequelize.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigraciones() {
  const sql = readFileSync(join(__dirname, "migration_v2.sql"), "utf8");
  await sequelize.query(sql);
}
