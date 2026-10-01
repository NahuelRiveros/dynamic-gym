import { defineConfig } from "vitest/config";
import { conexionDeTest, leerEnvTest, urlDeTest } from "./tests/base_test.js";

const envTest = leerEnvTest();
const conexion = conexionDeTest(envTest);

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js", "tests/**/*.test.js"],
    // dotenv no pisa variables ya definidas: lo de acá gana sobre el .env de desarrollo.
    // DATABASE_URL1 apunta a la base local de test y los servicios externos van apagados
    // (sin mails ni cobros reales).
    env: {
      ...envTest,
      NODE_ENV: "test",
      DATABASE_URL1: urlDeTest(conexion),
      DB_SSL: "false",
      SMTP_USER: "",
      SMTP_PASS: "",
      MP_ACCESS_TOKEN: "",
      SEED_SECRET: "",
    },
    globalSetup: ["./tests/preparar_base.js"],
    setupFiles: ["./tests/verificar_conexion.js"],
    // Todos los tests comparten la misma base: uno a la vez.
    fileParallelism: false,
  },
});
