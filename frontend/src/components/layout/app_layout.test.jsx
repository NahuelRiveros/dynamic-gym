import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { sesionComo } from "../../test/servidor_mock.js";
import AppLayout from "./app_layout.jsx";

const pagina = (
  <AppLayout>
    <p>Contenido</p>
  </AppLayout>
);

describe("Avisos de audio del gimnasio", () => {
  it("un visitante sin sesión no ve el botón para activarlos", async () => {
    renderizar(pagina, { ruta: "/" });

    expect(await screen.findByRole("link", { name: "Ingresar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Activar avisos de audio/ })).not.toBeInTheDocument();
  });

  it("con sesión iniciada aparece el botón", async () => {
    sesionComo({ roles: ["staff"] });
    renderizar(pagina, { ruta: "/kiosk" });

    expect(await screen.findByRole("button", { name: /Activar avisos de audio/ })).toBeInTheDocument();
  });
});
