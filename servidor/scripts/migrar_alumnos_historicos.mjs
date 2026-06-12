/**
 * Migra los alumnos históricos de public a gym_v3 que quedaron fuera
 * de la migración original (planes expirados hace más de 3 meses).
 */
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
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || "",
    });

const client = await pool.connect();

try {
  await client.query("BEGIN");

  // 1. Insertar todas las personas que son alumnos y aún no están en gym_v3
  const { rowCount: personas } = await client.query(`
    INSERT INTO gym_v3.persona (
      id, tipo_documento_id, sexo_id, tipo_persona_id,
      nombre, apellido, fecha_nacimiento, documento, email,
      celular, celular_emergencia, creado_en, actualizado_en
    )
    SELECT DISTINCT ON (p.id)
      p.id,
      COALESCE(p.tipo_documento_id, 1),
      p.sexo_id,
      p.tipo_persona_id,
      p.nombre,
      p.apellido,
      p.fecha_nacimiento::date,
      p.documento,
      p.email,
      p.celular,
      p.celular_emergencia,
      COALESCE(p.actualizado_en, NOW()),
      COALESCE(p.actualizado_en, NOW())
    FROM public.persona p
    WHERE EXISTS (SELECT 1 FROM public.alumno a WHERE a.persona_id = p.id)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log(`✅ Personas insertadas/ya existían: ${personas}`);

  // 2. Insertar todos los alumnos que no están en gym_v3
  const { rowCount: alumnos } = await client.query(`
    INSERT INTO gym_v3.alumno (id, persona_id, estado_id, creado_en, actualizado_en)
    SELECT a.id, a.persona_id,
           COALESCE(a.estado_id, 2),
           COALESCE(a.actualizado_en, NOW()),
           COALESCE(a.actualizado_en, NOW())
    FROM public.alumno a
    WHERE EXISTS (SELECT 1 FROM gym_v3.persona gp WHERE gp.id = a.persona_id)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log(`✅ Alumnos insertados/ya existían: ${alumnos}`);

  await client.query("COMMIT");

  // Verificar
  const { rows } = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM gym_v3.persona) AS personas_v3,
      (SELECT COUNT(*) FROM gym_v3.alumno) AS alumnos_v3,
      (SELECT COUNT(*) FROM public.persona p WHERE EXISTS (SELECT 1 FROM public.alumno a WHERE a.persona_id = p.id)) AS total_publico
  `);
  console.log("\n📊 Resultado:");
  console.log(`   gym_v3.persona: ${rows[0].personas_v3}`);
  console.log(`   gym_v3.alumno:  ${rows[0].alumnos_v3}`);
  console.log(`   public alumnos: ${rows[0].total_publico}`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌ Error:", err.message);
  throw err;
} finally {
  client.release();
  await pool.end();
}
