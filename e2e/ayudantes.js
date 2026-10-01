import { expect } from "@playwright/test";

/** Inicia sesión desde la pantalla de login y sigue a `destino` (como hace la app tras la bienvenida). */
export async function ingresar(page, { email, password }, destino = "/") {
  await page.goto(`/login?from=${encodeURIComponent(destino)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("¡Bienvenido al sistema!")).toBeVisible();
  await page.getByRole("button", { name: "Continuar ahora" }).click();
  await expect(page).toHaveURL(destino);
}
