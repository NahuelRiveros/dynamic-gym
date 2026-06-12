import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host:     process.env.DB_HOST || "localhost",
      port:     Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || "dynamicgym",
      user:     process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "",
    });

async function main() {
  console.log("\n══════════════════════════════════════════");
  console.log("  EJECUTANDO MIGRACIÓN A GYM_V3");
  console.log("══════════════════════════════════════════\n");

  const sqlPath = path.join(__dirname, "migrar_a_v3.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("🔌 Conectando a la base de datos...");
  await pool.query("SELECT 1");
  const { rows: [db] } = await pool.query("SELECT current_database()");
  console.log(`✅ Conectado a: ${db.current_database}\n`);

  // Verificar que gym_v3 no exista (evitar doble ejecución sin confirmación)
  const { rows: [v3] } = await pool.query(
    `SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'gym_v3'`
  );
  if (Number(v3.count) > 0) {
    console.log("⚠️  El schema gym_v3 ya existe.");
    console.log("   El script es idempotente (ON CONFLICT DO NOTHING), puede ejecutarse igualmente.");
    console.log("   Continuando...\n");
  }

  console.log("⏳ Ejecutando migración (esto puede tomar unos segundos)...\n");

  // pg no acepta múltiples statements en una query — necesitamos dividir el SQL
  // pero el script usa BEGIN/COMMIT, así que lo ejecutamos como bloque único en el cliente
  const client = await pool.connect();
  try {
    // Ejecutar como bloque completo — el driver pg soporta esto a través de simple query protocol
    const result = await client.query(sql);

    // Mostrar los RAISE NOTICE como output
    console.log("✅ Migración ejecutada sin errores\n");
  } catch (err) {
    console.error("❌ Error durante la migración:");
    console.error("   ", err.message);
    if (err.where) console.error("   Contexto:", err.where);
    throw err;
  } finally {
    client.release();
  }

  // Verificación post-migración
  console.log("📊 Verificando datos migrados en gym_v3:");
  const tablas = ["persona","alumno","membresia","ingreso","usuario","usuario_rol","plan_tipo","modulo","permiso","rol_permiso"];
  for (const t of tablas) {
    try {
      const { rows: [r] } = await pool.query(`SELECT COUNT(*) FROM gym_v3.${t}`);
      const icono = Number(r.count) > 0 ? "✅" : "·";
      console.log(`   ${icono} gym_v3.${t.padEnd(20)} ${String(r.count).padStart(6)} filas`);
    } catch (e) {
      console.log(`   ❌ gym_v3.${t.padEnd(20)} error: ${e.message}`);
    }
  }

  // Verificar vista de recaudación
  try {
    const { rows: [vr] } = await pool.query(`SELECT COUNT(*) FROM gym_v3.vista_recaudacion_completa`);
    console.log(`\n✅ vista_recaudacion_completa: ${vr.count} registros (histórico + nuevo)`);
  } catch (e) {
    console.log(`\n❌ vista_recaudacion_completa: ${e.message}`);
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  MIGRACIÓN COMPLETADA");
  console.log("══════════════════════════════════════════\n");
}

main()
  .catch(() => process.exit(1))
  .finally(() => pool.end());
