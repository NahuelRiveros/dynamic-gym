import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { API, servidorMock } from "../../test/servidor_mock.js";
import ConfirmDialog from "../ui/confirm_dialog.jsx";
import HistorialStockModal from "./historial_stock_modal.jsx";
import MovimientoStockModal from "./movimiento_stock_modal.jsx";
import PlanFormModal from "./plan_form_modal.jsx";
import StaffPasswordModal from "./staff_password_modal.jsx";

const conQuery = (ui) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("Modal del panel", () => {
  it("tiene nombre accesible, cierra con Escape y no se cierra mientras guarda", () => {
    const cerrar = vi.fn();
    const { rerender } = render(<PlanFormModal abierto onClose={cerrar} onGuardar={vi.fn()} />);

    const dialogo = screen.getByRole("dialog", { name: "Nuevo plan" });
    fireEvent(dialogo, new Event("cancel", { cancelable: true })); // lo que hace el navegador con Escape
    expect(cerrar).toHaveBeenCalledTimes(1);

    rerender(<PlanFormModal abierto onClose={cerrar} onGuardar={vi.fn()} cargando />);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(cerrar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
  });

  it("cerrado no muestra nada", () => {
    render(<PlanFormModal abierto={false} onClose={vi.fn()} onGuardar={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Formulario de plan", () => {
  it("al editar arranca con los datos del plan y manda los números como números", async () => {
    const usuario = userEvent.setup();
    const guardar = vi.fn();
    render(<PlanFormModal abierto onClose={vi.fn()} onGuardar={guardar} planEditar={{ descripcion: "Mensual libre", dias_totales: 30, ingresos: 0, precio: "15000.00" }} />);

    expect(screen.getByRole("dialog", { name: "Editar plan" })).toBeInTheDocument();
    await usuario.clear(screen.getByLabelText("Precio"));
    await usuario.type(screen.getByLabelText("Precio"), "18000");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(guardar).toHaveBeenCalledWith({ descripcion: "Mensual libre", dias_totales: 30, ingresos: 0, precio: 18000 });
  });

  it("no acepta 0 días (el servidor tampoco) y avisa los errores", async () => {
    const usuario = userEvent.setup();
    const guardar = vi.fn();
    render(<PlanFormModal abierto onClose={vi.fn()} onGuardar={guardar} />);

    await usuario.type(screen.getByLabelText("Descripción"), "Pase");
    await usuario.clear(screen.getByLabelText("Días totales"));
    await usuario.type(screen.getByLabelText("Días totales"), "0");
    await usuario.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Los días totales deben ser un entero mayor a 0");
    expect(guardar).not.toHaveBeenCalled();
  });
});

describe("Movimiento de stock", () => {
  const producto = { id: 7, nombre: "Agua 500 ml", stock_actual: 3 };

  it("no deja vender más de lo que hay y la baja pide motivo", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.fn();
    const { unmount } = render(<MovimientoStockModal abierto tipo="venta" producto={producto} onClose={vi.fn()} onConfirmar={confirmar} />);

    await usuario.clear(screen.getByLabelText(/Cantidad/));
    await usuario.type(screen.getByLabelText(/Cantidad/), "5");
    await usuario.click(screen.getByRole("button", { name: "Vender" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Solo quedan 3 unidad(es) en stock");
    unmount();

    render(<MovimientoStockModal abierto tipo="baja" producto={producto} onClose={vi.fn()} onConfirmar={confirmar} />);
    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }));
    expect(screen.getByRole("alert")).toHaveTextContent("El motivo es obligatorio");

    await usuario.type(screen.getByLabelText("Motivo"), "Vencido");
    await usuario.click(screen.getByRole("button", { name: "Dar de baja" }));
    expect(confirmar).toHaveBeenCalledWith({ cantidad: 1, metodo_pago: "EFECTIVO", motivo: "Vencido" });
  });
});

describe("Historial de stock", () => {
  it("carga los movimientos; si falla, ofrece reintentar", async () => {
    let falla = true;
    servidorMock.use(
      http.get(`${API}/stock/7/movimientos`, () =>
        falla
          ? HttpResponse.json({ ok: false, mensaje: "Sin conexión" }, { status: 500 })
          : HttpResponse.json({ ok: true, data: [{ id: 1, tipo: "venta", cantidad: 2, precio_unitario: 800, metodo_pago: "EFECTIVO", usuario: "Sergio Staff", creado_en: "2026-10-01T12:00:00Z" }] }),
      ),
    );
    conQuery(<HistorialStockModal abierto producto={{ id: 7, nombre: "Agua 500 ml" }} onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    falla = false;
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Sergio Staff")).toBeInTheDocument();
  });
});

describe("Contraseña y confirmación", () => {
  it("la contraseña tiene que coincidir", async () => {
    const usuario = userEvent.setup();
    const guardar = vi.fn();
    render(<StaffPasswordModal abierto onClose={vi.fn()} onGuardar={guardar} staffSeleccionado={{ gym_persona_nombre: "Sergio", gym_persona_apellido: "Staff" }} />);

    expect(screen.getByText("Actualizá la contraseña de Sergio Staff. La anterior deja de funcionar.")).toBeInTheDocument();
    await usuario.type(screen.getByLabelText("Nueva contraseña"), "clave-1");
    await usuario.type(screen.getByLabelText("Confirmar contraseña"), "clave-2");
    await usuario.click(screen.getByRole("button", { name: "Actualizar contraseña" }));

    expect(await screen.findByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(guardar).not.toHaveBeenCalled();
  });

  it("la confirmación avisa qué va a pasar y confirma o cancela", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.fn();
    render(<ConfirmDialog open title="¿Desactivar plan?" message="Los alumnos que ya lo tienen no se ven afectados." onConfirm={confirmar} onClose={vi.fn()} confirmLabel="Desactivar" />);

    expect(screen.getByRole("dialog", { name: "¿Desactivar plan?" })).toHaveTextContent("Los alumnos que ya lo tienen no se ven afectados.");
    await usuario.click(screen.getByRole("button", { name: "Desactivar" }));
    expect(confirmar).toHaveBeenCalled();
  });
});
