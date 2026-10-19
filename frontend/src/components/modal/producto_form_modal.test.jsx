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
  it("sin aviso ni stock inicial guarda mínimo 0 y stock 0, y explica qué pasa", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    expect(screen.getByRole("radio", { name: "No avisar" })).toBeChecked();
    expect(screen.getByText(/nunca va a mostrar el aviso de reponer/)).toBeInTheDocument();
    expect(screen.getByText(/se crea con 0 unidades/i)).toBeInTheDocument();

    await usuario.type(screen.getByLabelText("Nombre"), "  Agua 500 ml ");
    await usuario.selectOptions(screen.getByLabelText("Categoría (opcional)"), "3");
    await usuario.type(screen.getByLabelText("Precio de venta"), "1500");
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Agua 500 ml", categoria_id: 3, precio_venta: 1500, stock_minimo: 0, stock_inicial: 0 },
      expect.anything(),
    );
  });

  it("con stock inicial y aviso al agotarse guarda mínimo 1 y las unidades", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    await usuario.type(screen.getByLabelText("Nombre"), "Toalla de mano");
    await usuario.type(screen.getByLabelText("Precio de venta"), "6000");
    await usuario.type(screen.getByLabelText("Stock inicial (opcional)"), "12");
    await usuario.click(screen.getByRole("radio", { name: /cuando se agote/ }));

    expect(screen.getByText(/Se crea con 12 unidades/)).toBeInTheDocument();
    expect(screen.getByText(/Cuando se termine \(0 unidades\)/)).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Toalla de mano", categoria_id: null, precio_venta: 6000, stock_minimo: 1, stock_inicial: 12 },
      expect.anything(),
    );
  });

  it("avisar con pocas pide 2 o más y advierte si ya arranca para reponer", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    await usuario.type(screen.getByLabelText("Nombre"), "Proteína 1 kg");
    await usuario.type(screen.getByLabelText("Precio de venta"), "25000");
    await usuario.type(screen.getByLabelText("Stock inicial (opcional)"), "3");
    await usuario.click(screen.getByRole("radio", { name: "Avisar cuando queden pocas" }));
    await usuario.type(screen.getByLabelText("Avisar con menos de"), "1");
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByText(/Poné 2 o más/)).toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalled();

    await usuario.clear(screen.getByLabelText("Avisar con menos de"));
    await usuario.type(screen.getByLabelText("Avisar con menos de"), "5");
    expect(screen.getByText(/ya arranca marcado para reponer/)).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Proteína 1 kg", categoria_id: null, precio_venta: 25000, stock_minimo: 5, stock_inicial: 3 },
      expect.anything(),
    );
  });

  it("no deja guardar sin nombre ni precio, ni con unidades negativas", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir();

    await usuario.type(screen.getByLabelText("Stock inicial (opcional)"), "-2");
    await usuario.click(screen.getByRole("button", { name: "Crear producto" }));

    expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el precio de venta (puede ser 0)")).toBeInTheDocument();
    expect(screen.getByText(/tienen que ser un número entero/)).toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalled();
  });

  it("al editar muestra el stock sin dejar cambiarlo y no manda stock_inicial", async () => {
    const usuario = userEvent.setup();
    const guardar = abrir({
      productoEditar: { id: 7, nombre: "Barra de cereal", categoria_id: 3, precio_venta: "800.00", stock_minimo: 10, stock_actual: 18 },
    });

    expect(screen.queryByLabelText("Stock inicial (opcional)")).not.toBeInTheDocument();
    expect(screen.getByText("18 unidades")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Avisar cuando queden pocas" })).toBeChecked();
    expect(screen.getByLabelText("Avisar con menos de")).toHaveValue(10);
    expect(screen.getByText(/Guardar no las cambia/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("radio", { name: "No avisar" }));
    await usuario.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(guardar).toHaveBeenCalledWith(
      { nombre: "Barra de cereal", categoria_id: 3, precio_venta: 800, stock_minimo: 0 },
      expect.anything(),
    );
  });
});
