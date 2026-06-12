/**
 * Restaura la contraseña de admin@gym.com en gym_v3 desde public.usuario
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
  : new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS || "" });

const { rowCount } = await pool.query(`
  UPDATE gym_v3.usuario gv3
  SET contrasena = pub.contrasena
  FROM public.usuario pub
  WHERE gv3.persona_id = pub.persona_id
    AND pub.persona_id = (SELECT id FROM public.persona WHERE email = 'admin@gym.com')
`);
console.log(`✅ Contraseña de admin@gym.com restaurada desde public.usuario (${rowCount} fila actualizada)`);
pool.end();
