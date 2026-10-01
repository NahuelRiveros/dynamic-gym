import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DataGrid from "./data_grid.jsx";
import { procesarFilas } from "./procesar_filas.js";

const PLANES = [
  { id: 1, descripcion: "Mensual libre", precio: 15000, persona: { nombre: "Ana" } },
  { id: 2, descripcion: "Quincenal", precio: 9000, persona: { nombre: "Beto" } },
  { id: 3, descripcion: "Semanal", precio: 5000, persona: { nombre: "Carla" } },
];
const COLUMNAS = [
  { key: "descripcion", label: "Plan", sortable: true },
  { key: "precio", label: "Precio", sortable: true, align: "right" },
  { key: "persona.nombre", label: "Creado por", searchable: false },
];

// En los tests no hay matchMedia (se ve la tabla); para la vista de celular se simula.
function simularCelular() {
  vi.stubGlobal("matchMedia", (q) => ({ matches: q.includes("max-width"), addEventListener() {}, removeEventListener() {} }));
}
afterEach(() => vi.unstubAllGlobals());

const filasDeTabla = () => screen.getAllByRole("row").slice(1).map((f) => within(f).getAllByRole("cell")[0].textContent);

describe("procesarFilas", () => {
  it("busca sin distinguir mayúsculas solo en las columnas buscables y ordena números como números", () => {
    expect(procesarFilas({ filas: PLANES, columnas: COLUMNAS, busqueda: "SEMA" }).map((p) => p.id)).toEqual([3]);
    expect(procesarFilas({ filas: PLANES, columnas: COLUMNAS, busqueda: "beto" })).toEqual([]);
    expect(procesarFilas({ filas: PLANES, columnas: COLUMNAS, orden: { key: "precio", dir: "asc" } }).map((p) => p.precio)).toEqual([5000, 9000, 15000]);
  });
});

describe("DataGrid", () => {
  it("busca, ordena con el teclado (botón del encabezado) y anuncia el orden", async () => {
    const usuario = userEvent.setup();
    render(<DataGrid rows={PLANES} columns={COLUMNAS} searchPlaceholder="Buscar plan…" />);

    await usuario.click(screen.getByRole("button", { name: "Precio" }));
    expect(filasDeTabla()).toEqual(["Semanal", "Quincenal", "Mensual libre"]);
    expect(screen.getByRole("columnheader", { name: "Precio" })).toHaveAttribute("aria-sort", "ascending");

    await usuario.type(screen.getByRole("searchbox", { name: "Buscar plan…" }), "quin");
    expect(filasDeTabla()).toEqual(["Quincenal"]);
  });

  it("pagina en memoria y muestra el rango", async () => {
    const usuario = userEvent.setup();
    render(<DataGrid rows={PLANES} columns={COLUMNAS} pageSize={2} pageSizeOptions={[2, 10]} />);

    expect(screen.getByRole("navigation", { name: "Paginación" })).toHaveTextContent("1–2 de 3");
    await usuario.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(filasDeTabla()).toEqual(["Semanal"]);
  });

  it("acciones por fila: respeta show y disabled, y no dispara el click de la fila", async () => {
    const usuario = userEvent.setup();
    const editar = vi.fn();
    const abrir = vi.fn();
    render(
      <DataGrid
        rows={PLANES}
        columns={COLUMNAS}
        onRowClick={abrir}
        actions={[
          { key: "editar", label: "Editar", onClick: editar },
          { key: "borrar", label: "Borrar", variant: "danger", show: (f) => f.id !== 1, disabled: (f) => f.id === 2 },
        ]}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Borrar" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Borrar" })[0]).toBeDisabled();

    await usuario.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(editar).toHaveBeenCalledWith(PLANES[0]);
    expect(abrir).not.toHaveBeenCalled();
  });

  it("la fila se abre con Enter desde el teclado", async () => {
    const usuario = userEvent.setup();
    const abrir = vi.fn();
    render(<DataGrid rows={PLANES} columns={COLUMNAS} onRowClick={abrir} searchable={false} />);

    screen.getAllByRole("row")[2].focus();
    await usuario.keyboard("{Enter}");
    expect(abrir).toHaveBeenCalledWith(PLANES[1]);
  });

  it("modo servidor: no filtra por su cuenta, avisa la búsqueda y pide la página", async () => {
    const usuario = userEvent.setup();
    const onPageChange = vi.fn();
    const onSearch = vi.fn();
    render(<DataGrid rows={PLANES.slice(0, 2)} columns={COLUMNAS} page={1} totalPages={3} totalRows={6} pageSize={2} onPageChange={onPageChange} onSearch={onSearch} />);

    expect(screen.getByRole("navigation", { name: "Paginación" })).toHaveTextContent("1–2 de 6");
    await usuario.type(screen.getByRole("searchbox"), "x");
    expect(onSearch).toHaveBeenCalledWith("x");
    expect(filasDeTabla()).toHaveLength(2);

    await usuario.click(screen.getByRole("button", { name: "Última página" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("cargando, vacío y celular (una tarjeta por fila con rótulos y acciones con texto)", () => {
    const { rerender } = render(<DataGrid rows={[]} columns={COLUMNAS} loading />);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");

    rerender(<DataGrid rows={[]} columns={COLUMNAS} emptyMessage="No hay planes cargados." />);
    expect(screen.getByText("No hay planes cargados.")).toBeInTheDocument();

    simularCelular();
    rerender(<DataGrid rows={PLANES} columns={COLUMNAS} title="Planes" actions={[{ key: "editar", label: "Editar", onClick: () => {} }]} />);
    const tarjetas = within(screen.getByRole("list", { name: "Planes" })).getAllByRole("listitem");
    expect(tarjetas).toHaveLength(3);
    expect(within(tarjetas[0]).getByText("Mensual libre")).toBeInTheDocument();
    expect(within(tarjetas[0]).getByText("Precio")).toBeInTheDocument();
    expect(within(tarjetas[0]).getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });
});
