import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { haceCuanto } from "../../lib/fecha_ar.js";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock } from "../../test/servidor_mock.js";
import PersonalPage from "./personal_page.jsx";

const persona = (id, nombre, activo, ultimo = null) => ({
  gym_usuario_id: id,
  gym_persona_nombre: nombre,
  gym_persona_apellido: "Test",
  gym_persona_email: `${nombre.toLowerCase()}@gym.com`,
  gym_persona_documento: `4000000${id}`,
  gym_usuario_activo: activo,
  gym_usuario_ultimo_login: ultimo,
});
const lista = (items) => http.get(`${API}/staff`, () => HttpResponse.json({ ok: true, data: items }));

describe("Hace cuánto", () => {
  it("dice el tiempo en palabras", () => {
    const ahora = new Date("2026-10-09T15:00:00Z");
    expect(haceCuanto("2026-10-09T14:55:00Z", ahora)).toBe("hace 5 minutos");
    expect(haceCuanto("2026-10-08T12:00:00Z", ahora)).toBe("ayer");
    expect(haceCuanto("2026-07-01T12:00:00Z", ahora)).toBe("hace 3 meses");
    expect(haceCuanto(null, ahora)).toBeNull();
  });
});

describe("Personal", () => {
  it("muestra primero a los activos, con la cantidad en cada filtro", async () => {
    servidorMock.use(lista([persona(1, "Sergio", true, new Date().toISOString()), persona(2, "Lucía", false)]));
    renderizar(<PersonalPage />, { ruta: "/admin/staffManager" });
    const usuario = userEvent.setup();

    expect((await screen.findAllByText("Sergio Test")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Lucía Test")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activos 1" })).toHaveAttribute("aria-pressed", "true");

    await usuario.click(screen.getByRole("button", { name: "Inactivos 1" }));
    expect(screen.getAllByText("Lucía Test").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nunca").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Activar" }).length).toBeGreaterThan(0);
  });

  it("desactivar pide confirmación y explica que el historial se conserva", async () => {
    let pedido = null;
    servidorMock.use(
      lista([persona(1, "Sergio", true)]),
      http.patch(`${API}/staff/1/estado`, async ({ request }) => {
        pedido = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    renderizar(<PersonalPage />, { ruta: "/admin/staffManager" });
    const usuario = userEvent.setup();

    const [boton] = await screen.findAllByRole("button", { name: "Desactivar" });
    await usuario.click(boton);
    const dialogo = screen.getByRole("dialog");
    expect(dialogo).toHaveTextContent("¿Desactivar a Sergio Test?");
    expect(dialogo).toHaveTextContent("Su historial (cobros, ventas) se conserva");

    await usuario.click(within(dialogo).getByRole("button", { name: "Desactivar" }));
    expect(pedido).toEqual({ activo: false });
  });

  it("agregar valida los datos antes de mandar, y un email repetido se ve dentro del modal", async () => {
    servidorMock.use(
      lista([]),
      http.post(`${API}/staff`, () => HttpResponse.json({ ok: false, codigo: "EMAIL_EN_USO", mensaje: "Ese email ya está en uso" }, { status: 400 })),
    );
    renderizar(<PersonalPage />, { ruta: "/admin/staffManager" });
    const usuario = userEvent.setup();

    expect(await screen.findByText("No hay personal activo.")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Agregar al personal" }));
    const dialogo = screen.getByRole("dialog");
    await usuario.type(within(dialogo).getByLabelText("DNI"), "12.345abc");
    await usuario.click(within(dialogo).getByRole("button", { name: "Agregar al personal" }));
    expect(within(dialogo).getByText("El nombre es obligatorio")).toBeInTheDocument();
    expect(within(dialogo).getByText("El documento debe contener solo números")).toBeInTheDocument();

    await usuario.type(within(dialogo).getByLabelText("Nombre"), "Ana");
    await usuario.type(within(dialogo).getByLabelText("Apellido"), "Nueva");
    await usuario.type(within(dialogo).getByLabelText("Email"), "ana@gym.com");
    await usuario.clear(within(dialogo).getByLabelText("DNI"));
    await usuario.type(within(dialogo).getByLabelText("DNI"), "40.111.222");
    await usuario.type(within(dialogo).getByLabelText("Contraseña", { exact: true }), "clave1");
    await usuario.click(within(dialogo).getByRole("button", { name: "Agregar al personal" }));

    expect(await within(dialogo).findByText("Ese email ya está en uso")).toBeInTheDocument();
  });
});
