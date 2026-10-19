import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import VenderTab from "./vender_tab.jsx";

const productos = [
  { id: 1, nombre: "Agua 500 ml", precio_venta: 1500, stock_actual: 8, activo: true },
  { id: 2, nombre: "Barra de cereal", precio_venta: 800, stock_actual: 0, activo: true },
  { id: 3, nombre: "Guantes viejos", precio_venta: 9000, stock_actual: 4, activo: false },
];

const filaDe = (nombre) => screen.getAllByText(nombre)[0].closest("tr, li, article, [role='row']") ?? document.body;

describe("Pestaña Vender", () => {
  it("muestra los activos aunque no tengan stock: sin unidades se puede reponer pero no vender", () => {
    renderizar(<VenderTab productos={productos} cargando={false} />);

    expect(screen.getAllByText("Barra de cereal").length).toBeGreaterThan(0);
    expect(screen.queryByText("Guantes viejos")).not.toBeInTheDocument();

    const sinStock = within(filaDe("Barra de cereal"));
    expect(sinStock.getByText("Sin stock")).toBeInTheDocument();
    expect(sinStock.getByRole("button", { name: /Vender/ })).toBeDisabled();
    expect(sinStock.getByRole("button", { name: /Reponer/ })).toBeEnabled();

    expect(within(filaDe("Agua 500 ml")).getByRole("button", { name: /Vender/ })).toBeEnabled();
  });

  it("sin productos activos muestra el aviso de lista vacía", () => {
    renderizar(<VenderTab productos={[productos[2]]} cargando={false} />);
    expect(screen.getAllByText(/No hay productos activos/).length).toBeGreaterThan(0);
  });
});
