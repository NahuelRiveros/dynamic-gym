import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, servidorMock } from "../../test/servidor_mock.js";
import AvisoServidor from "./aviso_servidor.jsx";

const renderizar = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AvisoServidor />
    </QueryClientProvider>,
  );

describe("Aviso de servidor", () => {
  it("con el servidor bien no muestra nada", async () => {
    servidorMock.use(http.get(`${API}/health`, () => HttpResponse.json({ ok: true })));
    renderizar();

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("si no responde avisa que no hay conexión", async () => {
    servidorMock.use(http.get(`${API}/health`, () => HttpResponse.error()));
    renderizar();

    expect(await screen.findByRole("status")).toHaveTextContent("Sin conexión con el servidor");
  });

  it("si tarda (Render dormido) avisa que está despertando", async () => {
    servidorMock.use(http.get(`${API}/health`, async () => {
      await delay("infinite");
    }));
    renderizar();

    expect(await screen.findByRole("status", {}, { timeout: 4000 })).toHaveTextContent("Despertando el servidor…");
  });
});
