import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { sesionComo } from "../../test/servidor_mock.js";
import HomePage from "./home_page.jsx";
import LandingPublica from "./landing_publica.jsx";
import { saludoSegunHora } from "./saludo.js";

describe("Inicio", () => {
  it("un visitante ve la página del gimnasio, con cómo llegar y el atajo para alumnos", async () => {
    renderizar(<HomePage />, { ruta: "/" });

    expect(await screen.findByRole("heading", { level: 1, name: /Rompé/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Cómo llegar/ })[0]).toHaveAttribute("href", expect.stringContaining("maps"));
    expect(screen.getByRole("link", { name: /Consultá tu plan/ })).toHaveAttribute("href", "/consulta-plan");
    // Sin números inventados ni descripciones que solo se ven con el mouse.
    expect(screen.queryByText("200+")).not.toBeInTheDocument();
    expect(screen.getByText(/Entrenadores con formación profesional/)).toBeVisible();
  });

  it("el staff ve el saludo y solo sus tareas de Recepción", async () => {
    sesionComo({ nombre: "Sergio", roles: ["staff"] });
    renderizar(<HomePage />, { ruta: "/" });

    expect(await screen.findByRole("heading", { level: 1, name: /Sergio/ })).toBeInTheDocument();
    const recepcion = within(screen.getByRole("region", { name: "Recepción" }));
    expect(recepcion.getByRole("link", { name: /Cobrar plan/ })).toHaveAttribute("href", "/admin/pagos/registrar");
    expect(recepcion.getByRole("link", { name: /Ventas/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Gimnasio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Corregir plan/ })).not.toBeInTheDocument();
  });

  it("con sesión también se puede ver el sitio web", async () => {
    sesionComo({ roles: ["staff"] });
    renderizar(<HomePage />, { ruta: "/" });

    expect(await screen.findByRole("link", { name: "Ver el sitio web" })).toHaveAttribute("href", "/gimnasio");
    renderizar(<LandingPublica />, { ruta: "/gimnasio" });
    expect(screen.getByRole("heading", { level: 1, name: /Rompé/ })).toBeInTheDocument();
  });

  it("el admin ve también los reportes y la configuración", async () => {
    sesionComo({ roles: ["admin"] });
    renderizar(<HomePage />, { ruta: "/" });

    expect(await screen.findByRole("region", { name: "Reportes" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Gimnasio" })).getByRole("link", { name: /^Planes/ })).toBeInTheDocument();
  });

  it("saluda según la hora de Argentina, aunque el servidor esté en otra zona", () => {
    expect(saludoSegunHora(new Date("2026-10-09T12:00:00Z"))).toBe("Buen día"); // 9 h en Argentina
    expect(saludoSegunHora(new Date("2026-10-09T18:00:00Z"))).toBe("Buenas tardes"); // 15 h
    expect(saludoSegunHora(new Date("2026-10-10T01:30:00Z"))).toBe("Buenas noches"); // 22:30 h
  });
});
