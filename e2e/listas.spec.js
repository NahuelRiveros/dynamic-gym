import { expect, test } from "@playwright/test";
import { USUARIOS_TEST } from "../servidor/tests/armar_base.js";
import { ingresar } from "./ayudantes.js";

// El listado es una tabla en pantallas anchas y una tarjeta por fila en celular.
const listado = (page, isMobile) => (isMobile ? page.getByRole("list", { name: "Listado" }) : page.getByRole("table", { name: "Listado" }));

test("el admin ve el catálogo de planes y lo puede buscar", async ({ page, isMobile }) => {
  await ingresar(page, USUARIOS_TEST.admin, "/admin/planesViews");
  await expect(page.getByRole("heading", { name: "Catálogo de planes" })).toBeVisible();

  const lista = listado(page, isMobile);
  await expect(lista.getByText("Mensual libre")).toBeVisible();

  await page.getByRole("searchbox", { name: /Buscar plan/ }).fill("quince");
  await expect(lista.getByText("Quincenal")).toBeVisible();
  await expect(lista.getByText("Mensual libre")).toBeHidden();
});

test("el admin crea un plan desde el modal; Escape lo cierra y el foco vuelve al botón", async ({ page, isMobile }, testInfo) => {
  // Un nombre por proyecto: escritorio y celular comparten la base de los E2E.
  const nombre = `Pase E2E ${testInfo.project.name}`;
  await ingresar(page, USUARIOS_TEST.admin, "/admin/planesViews");

  const nuevo = page.getByRole("button", { name: "Nuevo plan" });
  await nuevo.click();
  await expect(page.getByRole("dialog", { name: "Nuevo plan" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(nuevo).toBeFocused();

  await nuevo.click();
  const modal = page.getByRole("dialog", { name: "Nuevo plan" });
  await modal.getByLabel("Descripción").fill(nombre);
  await modal.getByLabel("Ingresos").fill("8");
  await modal.getByLabel("Precio").fill("12000");
  await modal.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(listado(page, isMobile).getByText(nombre)).toBeVisible();

  // Repetido: el error del servidor se ve dentro del modal (antes quedaba detrás).
  await nuevo.click();
  await modal.getByLabel("Descripción").fill(nombre);
  await modal.getByRole("button", { name: "Guardar" }).click();
  await expect(modal.getByRole("alert")).toHaveText("Ya existe un plan con esa descripción");
});

test("el admin ve la lista de staff (antes fallaba siempre)", async ({ page, isMobile }) => {
  await ingresar(page, USUARIOS_TEST.admin, "/admin/staffManager");
  await expect(page.getByRole("heading", { name: "Personal", exact: true })).toBeVisible();

  const lista = listado(page, isMobile);
  await expect(lista.getByText(USUARIOS_TEST.staff.email)).toBeVisible();
  await expect(lista.getByRole("button", { name: "Contraseña" }).first()).toBeVisible();
});
