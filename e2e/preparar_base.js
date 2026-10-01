import { armarBaseDeTest } from "../servidor/tests/armar_base.js";
import { conexionDeTest, leerEnvTest } from "../servidor/tests/base_test.js";
import { BASE_E2E } from "./config_e2e.js";

// Lo corre playwright.config.js antes de levantar la API (Playwright arranca los webServer antes
// que el globalSetup): base local limpia con los mismos usuarios y alumnos que los tests del servidor.
await armarBaseDeTest(conexionDeTest({ ...leerEnvTest(), DB_NAME: BASE_E2E }));
