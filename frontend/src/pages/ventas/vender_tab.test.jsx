import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import VenderTab from "./vender_tab.jsx";

const productos = [
  { id: 1, nombre: "Agua 500 ml", precio_venta: 1500, stock_actual: 8, activo: true, controla_stock: true },
  { id: 2, nombre: "Barra de cereal", precio_venta: 800, stock_actual: 0, activo: true, controla_stock: false },
  { id: 3, nombre: "Proteína", precio_venta: 30000, stock_actual: 0, activo: true, controla_stock: true },
  { id: 4, nombre: "Guantes viejos", precio_venta: 9000, stock_actual: 4, activo: false, controla_stock: true },
];

const filaDe = (nombre) => within(screen.getAllByText(nombre)[0].closest("tr, li, article, [role='row']"));

describe("Pestaña Vender", () => {
  it("sin control de stock se vende siempre y no ofrece Reponer", async () => {
    renderizar(<VenderTab productos={productos} cargando={false} />);
    expect(screen.queryByText("Guantes viejos")).not.toBeInTheDocument();

    const fila = filaDe("Barra de cereal");
    expect(fila.getByText("Sin control")).toBeInTheDocument();
    expect(fila.queryByRole("button", { name: /Reponer/ })).not.toBeInTheDocument();

    await userEvent.setup().click(fila.getByRole("button", { name: /Vender/ }));
    expect(screen.getByText(/sin control de stock/)).toBeInTheDocument();
  });

  it("con control de stock: agotado no se vende pero se repone; con unidades se vende", () => {
    renderizar(<VenderTab productos={productos} cargando={false} />);

    const agotado = filaDe("Proteína");
    expect(agotado.getByText("Sin stock")).toBeInTheDocument();
    expect(agotado.getByRole("button", { name: /Vender/ })).toBeDisabled();
    expect(agotado.getByRole("button", { name: /Reponer/ })).toBeEnabled();

    expect(filaDe("Agua 500 ml").getByRole("button", { name: /Vender/ })).toBeEnabled();
  });

  it("sin productos activos muestra el aviso de lista vacía", () => {
    renderizar(<VenderTab productos={[productos[3]]} cargando={false} />);
    expect(screen.getAllByText(/No hay productos activos/).length).toBeGreaterThan(0);
  });
});
