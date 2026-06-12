import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
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
  console.log("  DIAGNÓSTICO BASE DE DATOS — DYNAMIC GYM");
  console.log("══════════════════════════════════════════");

  await pool.query("SELECT 1");
  const { rows: [dbRow] } = await pool.query("SELECT current_database(), version()");
  console.log(`\n✅ Conexión OK`);
  console.log(`   Base de datos : ${dbRow.current_database}`);
  console.log(`   PostgreSQL    : ${dbRow.version.split(" ").slice(0,2).join(" ")}`);

  // Schemas existentes
  const { rows: schemas } = await pool.query(`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema','pg_catalog','pg_toast')
    ORDER BY schema_name
  `);
  console.log(`\n📂 Schemas en la base de datos:`);
  schemas.forEach(s => console.log(`   ${s.schema_name === "gym_v3" ? "✅" : "·"} ${s.schema_name}`));

  // Tablas y conteo en public
  console.log(`\n📊 Schema PUBLIC — conteo de registros:`);
  const tablasPub = ["persona","alumno","membresia","ingreso","usuario","plan_tipo","alumno_estado_log"];
  for (const t of tablasPub) {
    try {
      const { rows: [r] } = await pool.query(`SELECT COUNT(*) FROM public.${t}`);
      console.log(`   public.${t.padEnd(20)} ${String(r.count).padStart(6)} filas`);
    } catch { console.log(`   public.${t.padEnd(20)} ⚠️  no existe`); }
  }

  // gym_v3 si existe
  const { rows: [v3] } = await pool.query(`
    SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'gym_v3'
  `);
  if (Number(v3.count) > 0) {
    console.log(`\n📊 Schema GYM_V3 — ya existe, conteo de registros:`);
    for (const t of tablasPub) {
      try {
        const { rows: [r] } = await pool.query(`SELECT COUNT(*) FROM gym_v3.${t}`);
        console.log(`   gym_v3.${t.padEnd(20)} ${String(r.count).padStart(6)} filas`);
      } catch { console.log(`   gym_v3.${t.padEnd(20)} ⚠️  no existe`); }
    }
  } else {
    console.log(`\n⏳ Schema GYM_V3: no existe todavía (listo para migrar)`);
  }

  // Triggers activos en public
  const { rows: triggers } = await pool.query(`
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  `);
  if (triggers.length > 0) {
    console.log(`\n⚙️  Triggers activos en public:`);
    triggers.forEach(t => console.log(`   ${t.trigger_name} → ${t.event_object_table}`));
  } else {
    console.log(`\n✅ Sin triggers problemáticos en public`);
  }

  console.log("\n══════════════════════════════════════════\n");
}

main().catch(e => { console.error("❌ Error:", e.message); process.exit(1); })
      .finally(() => pool.end());
