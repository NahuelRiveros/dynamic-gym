import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });
const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT||5432), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS || "" });

// Tipos de columnas clave en public (para verificar casts necesarios en migración)
const { rows } = await pool.query(`
  SELECT table_name, column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name IN ('ingreso','membresia','alumno','persona')
  ORDER BY table_name, column_name
`);
console.log("\nTodas las columnas en public (ingreso, membresia, alumno, persona):");
rows.forEach(r => console.log(` ${r.table_name.padEnd(12)} ${r.column_name.padEnd(30)} ${r.data_type.padEnd(35)} null=${r.is_nullable}`));
pool.end();
