import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { QueryTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigraciones() {
  const rows = await sequelize.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'gym_v3'",
    { type: QueryTypes.SELECT }
  );

  if (!rows.length) {
    console.log("[migration] gym_v3 no existe → ejecutando setup inicial...");
    const setupSql = readFileSync(join(__dirname, "setup_gym_v3.sql"), "utf8");
    await sequelize.query(setupSql);
    console.log("[migration] gym_v3 inicializado ✓");
  }

  const legacySql = readFileSync(join(__dirname, "migration_v2.sql"), "utf8");
  await sequelize.query(legacySql);

  const stockSql = readFileSync(join(__dirname, "migration_v3_stock.sql"), "utf8");
  await sequelize.query(stockSql);
}
