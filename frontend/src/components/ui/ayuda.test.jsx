import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Ayuda from "./ayuda.jsx";

describe("Ayuda (?)", () => {
  it("al tocarla muestra la explicación y Escape la cierra", async () => {
    const usuario = userEvent.setup();
    render(<Ayuda texto="Se avisa cuando queden pocas unidades." etiqueta="Qué es el stock mínimo" />);
    const boton = screen.getByRole("button", { name: "Qué es el stock mínimo" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    await usuario.click(boton);
    expect(screen.getByRole("tooltip")).toHaveTextContent("Se avisa cuando queden pocas unidades.");
    expect(boton).toHaveAccessibleDescription("Se avisa cuando queden pocas unidades.");

    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("el hover simulado del celular no la abre (solo el mouse)", () => {
    const { container } = render(<Ayuda texto="Explicación" />);
    const envoltorio = container.firstChild;

    fireEvent.pointerEnter(envoltorio, { pointerType: "touch" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.pointerEnter(envoltorio, { pointerType: "mouse" });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.pointerLeave(envoltorio, { pointerType: "mouse" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
