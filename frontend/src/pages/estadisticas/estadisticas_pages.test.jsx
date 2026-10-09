import { fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock, sesionComo } from "../../test/servidor_mock.js";
import VencimientosPage from "./vencimientos_proximos.jsx";

describe("Vencimientos", () => {
  it("cambiar los días pide los datos de nuevo", async () => {
    const pedidos = [];
    servidorMock.use(
      http.get(`${API}/estadisticas/vencimientos`, ({ request }) => {
        pedidos.push(new URL(request.url).searchParams.get("dias"));
        return HttpResponse.json({ ok: true, items: [], total: 0 });
      }),
    );
    sesionComo({ roles: ["admin"] });
    renderizar(<VencimientosPage />, { ruta: "/admin/estadisticas/vencimientos" });

    await waitFor(() => expect(pedidos).toEqual(["7"]));
    // El campo vuelve a 7 si se borra: se pone el valor de una, como al usar las flechitas.
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
    await waitFor(() => expect(pedidos).toEqual(["7", "3"]));
  });
});
