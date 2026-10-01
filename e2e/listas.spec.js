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

test("el admin ve la lista de staff (antes fallaba siempre)", async ({ page, isMobile }) => {
  await ingresar(page, USUARIOS_TEST.admin, "/admin/staffManager");
  await expect(page.getByRole("heading", { name: "Staff", exact: true })).toBeVisible();

  const lista = listado(page, isMobile);
  await expect(lista.getByText(USUARIOS_TEST.staff.email)).toBeVisible();
  await expect(lista.getByRole("button", { name: "Contraseña" }).first()).toBeVisible();
});
