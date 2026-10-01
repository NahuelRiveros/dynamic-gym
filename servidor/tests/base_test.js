import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const RUTA_ENV_TEST = fileURLToPath(new URL("../.env.test", import.meta.url));
const HOSTS_LOCALES = ["localhost", "127.0.0.1", "::1"];

/** Variables de servidor/.env.test (base LOCAL de los tests). Sin ese archivo los tests no corren. */
export function leerEnvTest() {
  if (!existsSync(RUTA_ENV_TEST)) {
    throw new Error("Falta servidor/.env.test: copiá servidor/.env.test.example y completá tu Postgres local.");
  }
  return dotenv.parse(readFileSync(RUTA_ENV_TEST));
}

/**
 * Candado: los tests borran y rearman su base en cada corrida. Solo se acepta una base local cuyo
 * nombre termine en _auto_test, así un .env mal configurado nunca puede tocar Neon (producción)
 * ni dynamicgym_test (copia de datos reales).
 */
export function verificarBaseDeTest({ host, nombre, url }) {
  if (url) throw new Error("Los tests no usan DATABASE_URL: solo la base local de servidor/.env.test.");
  if (!HOSTS_LOCALES.includes(host)) throw new Error(`La base de test tiene que ser local (host: ${host}).`);
  if (!/^[a-z0-9_]+_auto_test$/.test(nombre ?? "")) {
    throw new Error(`El nombre de la base de test tiene que terminar en _auto_test (es: ${nombre}).`);
  }
}

/**
 * URL de la base de test para DATABASE_URL1, que el servidor lee antes que DATABASE_URL
 * (configuracion_servidor/env.js). Así gana siempre sobre la URL de Neon que pueda haber en .env.
 */
export function urlDeTest({ user, password, host, port, database }) {
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

/** Datos de conexión de la base de test, ya verificados. */
export function conexionDeTest(env = leerEnvTest()) {
  const conexion = {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
  };
  verificarBaseDeTest({ host: conexion.host, nombre: conexion.database, url: env.DATABASE_URL || env.DATABASE_URL1 });
  return conexion;
}
