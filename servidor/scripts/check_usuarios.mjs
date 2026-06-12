import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS || "" });

const { rows } = await pool.query(`
  SELECT p.email, p.nombre, p.apellido, u.activo,
         u.contrasena IS NOT NULL AS tiene_pass,
         LEFT(u.contrasena, 10) AS pass_inicio,
         r.codigo AS rol
  FROM gym_v3.usuario u
  JOIN gym_v3.persona p ON p.id = u.persona_id
  LEFT JOIN gym_v3.usuario_rol ur ON ur.usuario_id = u.id
  LEFT JOIN gym_v3.rol r ON r.id = ur.rol_id
  ORDER BY r.codigo DESC, p.email
`);
console.log("\nUsuarios en gym_v3:");
rows.forEach(r => console.log(`  ${(r.email||'(sin email)').padEnd(35)} | ${(r.nombre||'').padEnd(15)} ${(r.apellido||'').padEnd(15)} | rol=${r.rol||'?'} | activo=${r.activo} | pass=${r.pass_inicio||'NULL'}...`));

// Also check public schema
const { rows: pub } = await pool.query(`
  SELECT p.email, p.nombre FROM public.usuario u
  JOIN public.persona p ON p.id = u.persona_id ORDER BY p.email
`);
console.log("\nUsuarios en public:");
pub.forEach(r => console.log(`  ${(r.email||'(sin email)').padEnd(35)} | ${r.nombre}`));

pool.end();
