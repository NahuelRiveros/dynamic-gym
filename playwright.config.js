import { defineConfig, devices } from "@playwright/test";
import { conexionDeTest, leerEnvTest, urlDeTest } from "./servidor/tests/base_test.js";
import { BASE_E2E, PUERTO_API, PUERTO_WEB } from "./e2e/config_e2e.js";

// API y web propias para los E2E: base local aparte (nunca Neon) y puertos aparte de `npm run dev`.
const envTest = leerEnvTest();
const conexion = conexionDeTest({ ...envTest, DB_NAME: BASE_E2E });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node e2e/preparar_base.js && npm --prefix servidor start",
      url: `http://localhost:${PUERTO_API}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      // DATABASE_URL1 gana sobre la DATABASE_URL del .env; mails y cobros apagados.
      env: {
        ...envTest,
        NODE_ENV: "test",
        PORT: String(PUERTO_API),
        DATABASE_URL1: urlDeTest(conexion),
        DB_NAME: BASE_E2E,
        DB_SSL: "false",
        CORS_ORIGIN: `http://localhost:${PUERTO_WEB}`,
        SMTP_USER: "",
        SMTP_PASS: "",
        MP_ACCESS_TOKEN: "",
        SEED_SECRET: "",
        // Los E2E inician sesión como admin más de 10 veces en una corrida (en producción no aplica).
        LOGIN_MAX_INTENTOS: "100",
      },
    },
    {
      command: `npm --prefix frontend run dev -- --port ${PUERTO_WEB} --strictPort`,
      url: `http://localhost:${PUERTO_WEB}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_API_URL: `http://localhost:${PUERTO_API}/api` },
    },
  ],
});
