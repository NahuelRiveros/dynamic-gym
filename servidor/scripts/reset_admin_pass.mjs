/**
 * Script de diagnóstico — resetea la contraseña del admin@gym.com a "test1234"
 * SOLO para verificar que el login funciona con gym_v3.
 * BORRAR DESPUÉS DEL TEST.
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import bcrypt from "bcrypt";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS || "" });

const hash = await bcrypt.hash("test1234", 10);

// Solo update en gym_v3, NO tocar public
const { rowCount } = await pool.query(
  `UPDATE gym_v3.usuario SET contrasena = $1
   WHERE persona_id = (SELECT id FROM gym_v3.persona WHERE email = 'admin@gym.com')`,
  [hash]
);
console.log(`✅ Contraseña seteada en gym_v3 para admin@gym.com (${rowCount} fila actualizada)`);
console.log(`   Usa: email=admin@gym.com, password=test1234`);
console.log(`   IMPORTANTE: cambiar contraseña real después del test.`);
pool.end();
