import { expect, test } from "@playwright/test";
import { USUARIOS_TEST } from "../servidor/tests/armar_base.js";
import { ingresar } from "./ayudantes.js";
import { PUERTO_API } from "./config_e2e.js";

const API = `http://localhost:${PUERTO_API}/api`;

// Lo que hace recepción con alguien nuevo: alta, cobro del plan e ingreso por el kiosco.
// Cada proyecto usa su propio DNI y plan: corren en paralelo sobre la misma base.
test("el staff da de alta a un alumno, le cobra el plan y el alumno entra por el kiosco", async ({ page, request, isMobile }, testInfo) => {
  const sufijo = testInfo.project.name === "celular" ? "2" : "1";
  const dni = `4455667${sufijo}`;
  const nombrePlan = `Mensual E2E ${sufijo}`;

  // Los planes de la base de prueba tienen precio 0 (no se pueden cobrar): uno con precio.
  const login = await request.post(`${API}/auth/login`, { data: { email: USUARIOS_TEST.admin.email, password: USUARIOS_TEST.admin.password } });
  const { token } = await login.json();
  await request.post(`${API}/planes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { descripcion: nombrePlan, dias_totales: 30, ingresos: 12, precio: 18000 },
  });

  await ingresar(page, USUARIOS_TEST.staff, "/register");
  await page.getByLabel("DNI").fill(dni);
  await page.getByLabel("Nombre").fill("Lola");
  await page.getByLabel("Apellido").fill(`Recepción ${sufijo}`);
  await page.getByLabel("Fecha de nacimiento").fill("2000-05-20");
  await page.getByRole("button", { name: "Dar de alta" }).click();

  await expect(page.getByRole("heading", { name: `Alta lista: Lola Recepción ${sufijo}` })).toBeVisible();
  await page.getByRole("link", { name: "Cobrarle el plan" }).click();

  // El alumno ya aparece buscado: se elige el plan y el método, y el botón dice cuánto se cobra.
  await expect(page.getByText(`Lola Recepción ${sufijo}`)).toBeVisible();
  await page.getByText(nombrePlan).click();
  await page.getByText("Transferencia", { exact: true }).click();
  await page.getByRole("button", { name: /Cobrar \$\s18\.000/ }).click();
  await expect(page.getByRole("heading", { name: /Cobrado: \$\s18\.000 en transferencia/ })).toBeVisible();

  if (isMobile) return; // el kiosco se usa en la PC de recepción (ver kiosco.spec.js)
  await page.goto("/kiosk");
  await page.getByPlaceholder("00.000.000").fill(dni);
  await page.getByRole("button", { name: "Registrar ingreso" }).click();
  await expect(page.getByText("Lola", { exact: false }).first()).toBeVisible();
});
