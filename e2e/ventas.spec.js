import { expect, test } from "@playwright/test";
import { USUARIOS_TEST } from "../servidor/tests/armar_base.js";
import { ingresar } from "./ayudantes.js";

// Fila (tabla) o tarjeta (celular) del producto.
const filaDe = (page, isMobile, nombre) =>
  (isMobile ? page.getByRole("listitem") : page.getByRole("row")).filter({ hasText: nombre });

test("el admin carga un producto, lo repone y lo vende; el stock se actualiza solo", async ({ page, isMobile }, testInfo) => {
  const nombre = `Agua E2E ${testInfo.project.name}`;
  await ingresar(page, USUARIOS_TEST.admin, "/admin/ventas");

  await page.getByRole("button", { name: "Productos" }).click();
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  const alta = page.getByRole("dialog", { name: "Nuevo producto" });
  await alta.getByLabel("Nombre").fill(nombre);
  await alta.getByLabel("Precio de venta").fill("800");
  await alta.getByRole("button", { name: "Guardar" }).click();
  await expect(alta).toBeHidden();

  await filaDe(page, isMobile, nombre).getByRole("button", { name: "Reponer" }).click();
  const reponer = page.getByRole("dialog", { name: "Reponer stock" });
  await reponer.getByLabel(/Cantidad/).fill("5");
  await reponer.getByRole("button", { name: "Reponer" }).click();
  await expect(reponer).toBeHidden();

  // En "Vender" ya aparece (la lista se refrescó sola después de reponer).
  await page.getByRole("button", { name: "Vender", exact: true }).first().click();
  const fila = filaDe(page, isMobile, nombre);
  await expect(fila).toContainText("5");
  await fila.getByRole("button", { name: "Vender" }).click();
  const venta = page.getByRole("dialog", { name: "Vender producto" });
  await venta.getByLabel(/Cantidad/).fill("2");
  await venta.getByRole("button", { name: "Vender" }).click();
  await expect(venta).toBeHidden();
  await expect(fila).toContainText("3");

  // Vender más de lo que hay: el aviso se ve dentro del modal.
  await fila.getByRole("button", { name: "Vender" }).click();
  await venta.getByLabel(/Cantidad/).fill("9");
  await venta.getByRole("button", { name: "Vender" }).click();
  await expect(venta.getByRole("alert")).toContainText("Solo quedan 3 unidad(es)");
});
