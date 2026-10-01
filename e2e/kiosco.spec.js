import { expect, test } from "@playwright/test";
import { ALUMNOS_TEST, USUARIOS_TEST } from "../servidor/tests/armar_base.js";
import { ingresar } from "./ayudantes.js";

// El kiosco es una pantalla fija de recepción. Una sola corrida (escritorio): el ingreso del
// alumno de prueba es uno por día, así que un segundo proyecto lo vería como "ya ingresó hoy".
test.skip(({ isMobile }) => isMobile, "El kiosco se usa en la PC o tablet de recepción");

test("un alumno con plan registra su ingreso; un DNI desconocido ve un aviso claro", async ({ page }) => {
  const { kiosco } = ALUMNOS_TEST;
  await ingresar(page, USUARIOS_TEST.staff, "/kiosk");
  const dni = page.getByPlaceholder("00.000.000");

  await dni.fill(kiosco.documento);
  await page.getByRole("button", { name: "Registrar ingreso" }).click();
  await expect(page.getByText(kiosco.nombre, { exact: false }).first()).toBeVisible();

  await page.keyboard.press("Escape");
  await page.reload();
  await dni.fill("11222333");
  await page.getByRole("button", { name: "Registrar ingreso" }).click();
  await expect(page.getByText("DNI no registrado")).toBeVisible();
});
