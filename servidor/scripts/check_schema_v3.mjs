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
  SELECT table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'gym_v3'
  ORDER BY table_name, ordinal_position
`);

let lastTable = "";
for (const r of rows) {
  if (r.table_name !== lastTable) {
    console.log(`\n▶ gym_v3.${r.table_name}`);
    lastTable = r.table_name;
  }
  console.log(`  ${r.column_name.padEnd(25)} ${r.data_type.padEnd(30)} null=${r.is_nullable}`);
}

pool.end();
