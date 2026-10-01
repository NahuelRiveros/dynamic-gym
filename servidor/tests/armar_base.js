import { readFileSync } from "node:fs";
import bcrypt from "bcrypt";
import pg from "pg";
import { conexionDeTest } from "./base_test.js";

// El mismo SQL con el que arranca una base nueva en producción (ver database/migration_runner.js).
// migration_v2.sql no: solo renombra las tablas viejas de public, que en una base vacía no existen.
const ARCHIVOS_SQL = ["setup_gym_v3.sql", "migration_v3_stock.sql", "migration_v4_categoria_producto.sql"];

export const USUARIOS_TEST = {
  admin: { nombre: "Ana", apellido: "Admin", documento: "90000001", email: "admin@test.local", password: "clave-admin-123", rol: "admin" },
  staff: { nombre: "Sergio", apellido: "Staff", documento: "90000002", email: "staff@test.local", password: "clave-staff-123", rol: "staff" },
};

// Alumnos de prueba (plan_tipo 1 del setup: mensual, 12 ingresos). `dias_plan` negativo = plan vencido.
export const ALUMNOS_TEST = {
  conPlan: { nombre: "Carla", apellido: "Activa", documento: "30111222", dias_plan: 30, ingresos: 12 },
  vencido: { nombre: "Diego", apellido: "Vencido", documento: "30333444", dias_plan: -1, ingresos: 12 },
  sinIngresos: { nombre: "Eva", apellido: "Agotada", documento: "30555666", dias_plan: 30, ingresos: 0 },
  // Para los E2E del kiosco, así no comparten el ingreso del día con los tests del servidor.
  kiosco: { nombre: "Franco", apellido: "Kiosco", documento: "30777888", dias_plan: 30, ingresos: 12 },
};

/** Borra y vuelve a crear la base de test (solo si pasa el candado de base_test.js). */
export async function armarBaseDeTest(conexion = conexionDeTest()) {
  const servidor = new pg.Client({ ...conexion, database: "postgres" });
  await servidor.connect();
  try {
    // El nombre ya pasó el candado (solo [a-z0-9_]): se puede usar en el DDL.
    await servidor.query(`DROP DATABASE IF EXISTS ${conexion.database} WITH (FORCE)`);
    await servidor.query(`CREATE DATABASE ${conexion.database}`);
  } finally {
    await servidor.end();
  }

  const base = new pg.Client(conexion);
  await base.connect();
  try {
    for (const archivo of ARCHIVOS_SQL) {
      await base.query(readFileSync(new URL(`../src/database/${archivo}`, import.meta.url), "utf8"));
    }
    // Lo que producción tiene y el SQL de arranque no: el esquema viejo public (vacío) y la vista de
    // recaudación. Con public.persona presente, migration_v2.sql se saltea al arrancar, como en producción.
    await base.query(readFileSync(new URL("./estructura_produccion.sql", import.meta.url), "utf8"));
    // Estado que existe en producción y no en setup_gym_v3.sql: lo usa el alta de alumnos.
    await base.query("INSERT INTO gym_v3.alumno_estado (id, descripcion) VALUES (3, 'Pendiente') ON CONFLICT (id) DO NOTHING");

    for (const u of Object.values(USUARIOS_TEST)) await crearUsuario(base, u);
    for (const a of Object.values(ALUMNOS_TEST)) await crearAlumno(base, a);
  } finally {
    await base.end();
  }
}

async function crearAlumno(base, { nombre, apellido, documento, dias_plan, ingresos }) {
  const { rows: [persona] } = await base.query(
    "INSERT INTO gym_v3.persona (tipo_documento_id, nombre, apellido, documento) VALUES (1, $1, $2, $3) RETURNING id",
    [nombre, apellido, documento],
  );
  const { rows: [alumno] } = await base.query(
    "INSERT INTO gym_v3.alumno (persona_id, estado_id) VALUES ($1, 1) RETURNING id",
    [persona.id],
  );
  // Un plan vencido empieza 31 días antes; uno vigente, hoy.
  const inicio = dias_plan < 0 ? dias_plan - 30 : 0;
  await base.query(
    `INSERT INTO gym_v3.membresia (alumno_id, plan_tipo_id, fecha_inicio, fecha_fin, dias_totales, ingresos_disponibles)
     VALUES ($1, 1, CURRENT_DATE + $2::int, CURRENT_DATE + $3::int, 30, $4)`,
    [alumno.id, inicio, dias_plan, ingresos],
  );
}

async function crearUsuario(base, { nombre, apellido, documento, email, password, rol }) {
  const { rows: [persona] } = await base.query(
    `INSERT INTO gym_v3.persona (tipo_documento_id, nombre, apellido, documento, email)
     VALUES (1, $1, $2, $3, $4) RETURNING id`,
    [nombre, apellido, documento, email],
  );
  const { rows: [usuario] } = await base.query(
    "INSERT INTO gym_v3.usuario (persona_id, contrasena) VALUES ($1, $2) RETURNING id",
    [persona.id, await bcrypt.hash(password, 10)],
  );
  await base.query(
    "INSERT INTO gym_v3.usuario_rol (usuario_id, rol_id) SELECT $1, id FROM gym_v3.rol WHERE codigo = $2",
    [usuario.id, rol],
  );
}
