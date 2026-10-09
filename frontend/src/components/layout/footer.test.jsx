import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import Footer from "./footer.jsx";

describe("Footer público", () => {
  it("habla del gimnasio: dirección, cómo llegar y accesos útiles para un visitante", () => {
    renderizar(<Footer />);

    expect(screen.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute("href", expect.stringContaining("maps"));
    expect(screen.getByRole("link", { name: /Instagram de Dynamic Gym/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Consultá tu plan" })).toHaveAttribute("href", "/consulta-plan");
    expect(screen.getByText("Lunes a viernes:")).toBeInTheDocument();
    expect(screen.getByText("7 a 23 h")).toBeInTheDocument();
    expect(screen.getByText("9 a 15 h")).toBeInTheDocument();
    // Nada del panel interno: a un visitante esos links lo mandaban al login.
    expect(screen.queryByText(/Kiosk|Lista de alumnos|MOD-0/)).not.toBeInTheDocument();
  });
});
