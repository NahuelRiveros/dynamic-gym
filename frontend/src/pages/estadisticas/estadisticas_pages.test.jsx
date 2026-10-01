import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock, sesionComo } from "../../test/servidor_mock.js";
import ListaAlumnosPage from "./lista_alumnos.jsx";
import VencimientosPage from "./vencimientos_proximos.jsx";

const alumno = (id, apellido) => ({ gym_alumno_id: id, gym_persona_nombre: "Ana", gym_persona_apellido: apellido, gym_persona_documento: `3000000${id}`, estado_id: 1, estado_desc: "Habilitado" });

describe("Listado de alumnos", () => {
  it("busca en el servidor recién cuando se deja de escribir y vuelve a la página 1", async () => {
    const pedidos = [];
    servidorMock.use(
      http.get(`${API}/alumnos/listado`, ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams);
        pedidos.push(params);
        const items = params.q ? [alumno(2, "Gómez")] : [alumno(1, "Pérez"), alumno(2, "Gómez")];
        return HttpResponse.json({ ok: true, items, pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 } });
      }),
    );
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos" });

    expect(await screen.findByText(/Pérez/)).toBeInTheDocument();
    await userEvent.setup().type(screen.getByRole("searchbox"), "gom");

    await waitFor(() => expect(screen.queryByText(/Pérez/)).not.toBeInTheDocument());
    expect(screen.getByText(/Gómez/)).toBeInTheDocument();
    // Un pedido al entrar y uno con la búsqueda completa: no uno por letra.
    expect(pedidos.map((p) => p.q ?? "")).toEqual(["", "gom"]);
    expect(pedidos.at(-1).page).toBe("1");
  });

  it("si falla muestra el error y deja reintentar", async () => {
    let falla = true;
    servidorMock.use(
      http.get(`${API}/alumnos/listado`, () =>
        falla
          ? HttpResponse.json({ ok: false, mensaje: "Servidor ocupado" }, { status: 500 })
          : HttpResponse.json({ ok: true, items: [alumno(1, "Pérez")], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      ),
    );
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos" });

    // El QueryClient de la app reintenta una vez; el de los tests no.
    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor ocupado");
    falla = false;
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText(/Pérez/)).toBeInTheDocument();
  });
});

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
