import { expect, test } from "@playwright/test";
import { USUARIOS_TEST } from "../servidor/tests/armar_base.js";
import { ingresar } from "./ayudantes.js";

test("el login rechaza datos incorrectos con un mensaje claro", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("nadie@ejemplo.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-incorrecta");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
});

test("el admin inicia sesión, ve la bienvenida con su nombre y vuelve a donde iba", async ({ page }) => {
  const { admin } = USUARIOS_TEST;

  await page.goto("/login");
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(admin.password);
  await page.getByRole("button", { name: "Ingresar" }).click();

  // El nombre también aparece en la barra de arriba: se busca dentro del cartel de bienvenida.
  const bienvenida = page.getByText("¡Bienvenido al sistema!").locator("..");
  await expect(bienvenida.getByText(`${admin.nombre} ${admin.apellido}`)).toBeVisible();
  await page.getByRole("button", { name: "Continuar ahora" }).click();
  await expect(page).toHaveURL("/");
});

test("una pantalla protegida sin sesión manda al login, y con sesión se ve", async ({ page }) => {
  await page.goto("/kiosk");
  await expect(page).toHaveURL(/\/login/);

  await ingresar(page, USUARIOS_TEST.staff, "/kiosk");
  await expect(page.getByRole("heading", { name: /INGRESÁ TU/ })).toBeVisible();
});
