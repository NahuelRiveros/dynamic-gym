import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderizar } from "../test/renderizar.jsx";
import { sesionComo } from "../test/servidor_mock.js";
import ProtectedRoute from "./protected_route.jsx";

const pantallaAdmin = (
  <ProtectedRoute roles={["admin"]}>
    <p>Panel de admin</p>
  </ProtectedRoute>
);
const otrasRutas = { "/login": "Pantalla de login", "/": "Inicio" };

describe("Rutas protegidas", () => {
  it("sin sesión manda al login", async () => {
    renderizar(pantallaAdmin, { ruta: "/admin", otrasRutas });

    expect(await screen.findByText("Pantalla de login")).toBeInTheDocument();
  });

  it("el staff no entra a una pantalla solo de admin: vuelve al inicio", async () => {
    sesionComo({ roles: ["staff"] });
    renderizar(pantallaAdmin, { ruta: "/admin", otrasRutas });

    expect(await screen.findByText("Inicio")).toBeInTheDocument();
    expect(screen.queryByText("Panel de admin")).not.toBeInTheDocument();
  });

  it("el admin ve la pantalla", async () => {
    sesionComo({ roles: ["admin"] });
    renderizar(pantallaAdmin, { ruta: "/admin", otrasRutas });

    expect(await screen.findByText("Panel de admin")).toBeInTheDocument();
  });
});
