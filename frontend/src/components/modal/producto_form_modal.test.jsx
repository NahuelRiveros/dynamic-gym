import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProductoFormModal from "./producto_form_modal.jsx";

const categorias = [{ value: 3, label: "Bebidas" }];
const abrir = (props = {}) => {
  const guardar = vi.fn();
  render(<ProductoFormModal abierto onClose={vi.fn()} onGuardar={guardar} categorias={categorias} {...props} />);
  return guardar;
};

describe("Formulario de producto", () => {
  it("sin aviso de reponer guarda stock mínimo 0 y explica qué pasa", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    expect(screen.getByRole("checkbox", { name: /Avisarme/ })).not.toBeChecked();
    expect(screen.queryByLabelText("Stock mínimo")).not.toBeInTheDocument();
    expect(screen.getByText(/nunca va a mostrar el aviso de reponer/)).toBeInTheDocument();
    expect(screen.getByText(/se crea con 0 unidades/)).toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Nombre"), "  Agua 500 ml ");
    await usuario.selectOptions(screen.getByLabelText("Categoría (opcional)"), "3");
    await usuario.type(screen.getByLabelText("Precio de venta"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Agua 500 ml", categoria_id: 3, precio_venta: 1500, stock_minimo: 0 },
      expect.anything(),
    );
  });

  it("con aviso pide un mínimo de 1 o más y avisa desde cuántas unidades", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    await usuario.type(screen.getByLabelText("Nombre"), "Proteína 1 kg");
    await usuario.type(screen.getByLabelText("Precio de venta"), "25000");
    await usuario.click(screen.getByRole("checkbox", { name: /Avisarme/ }));
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByText(/Poné 1 o más unidades/)).toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalled();

    await usuario.type(screen.getByLabelText("Stock mínimo"), "5");
    expect(screen.getByText(/menos de 5 unidades/)).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Proteína 1 kg", categoria_id: null, precio_venta: 25000, stock_minimo: 5 },
      expect.anything(),
    );
  });

  it("no deja guardar sin nombre ni precio", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el precio de venta (puede ser 0)")).toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalled();
  });

  it("al editar arranca con los datos del producto y el aviso tildado si tenía mínimo", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir({
      productoEditar: { id: 7, nombre: "Barra de cereal", categoria_id: 3, precio_venta: "800.00", stock_minimo: 10 },
    });

    expect(screen.getByRole("checkbox", { name: /Avisarme/ })).toBeChecked();
    expect(screen.getByLabelText("Stock mínimo")).toHaveValue(10);
    expect(screen.getByText(/no cambia las unidades en stock/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("checkbox", { name: /Avisarme/ }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Barra de cereal", categoria_id: 3, precio_venta: 800, stock_minimo: 0 },
      expect.anything(),
    );
  });
});
