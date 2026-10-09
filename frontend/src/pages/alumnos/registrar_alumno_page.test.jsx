import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock } from "../../test/servidor_mock.js";
import RegisterAlumnoPage from "./registrar_alumno_page.jsx";

const catalogos = http.get(`${API}/catalogos`, () => HttpResponse.json({ ok: true, sexos: [{ value: 1, label: "Femenino" }], tiposPlan: [] }));

async function completar(usuario, { dni = "30.999.888" } = {}) {
  await usuario.type(screen.getByLabelText("DNI"), dni);
  await usuario.type(screen.getByLabelText("Nombre"), "Lola");
  await usuario.type(screen.getByLabelText("Apellido"), "Nueva");
  await usuario.type(screen.getByLabelText("Fecha de nacimiento"), "2000-05-20");
  await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));
}

describe("Nuevo alumno", () => {
  it("da de alta con lo mínimo (DNI sin puntos, tipos fijos) y ofrece cobrarle el plan", async () => {
    let pedido = null;
    servidorMock.use(
      catalogos,
      http.post(`${API}/personas/registrar`, async ({ request }) => {
        pedido = await request.json();
        return HttpResponse.json({ ok: true, persona: { nombre: "Lola", apellido: "Nueva", documento: "30999888" }, alumno: { alumno_id: 55 } });
      }),
    );
    renderizar(<RegisterAlumnoPage />, { ruta: "/register" });
    const usuario = userEvent.setup();

    await completar(usuario);

    expect(pedido).toMatchObject({ documento: "30999888", nombre: "Lola", tipo_documento_id: 1, tipo_persona_id: 1, email: null, celular: null });
    expect(await screen.findByRole("heading", { name: "Alta lista: Lola Nueva" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cobrarle el plan" })).toHaveAttribute("href", "/admin/pagos/registrar?dni=30999888");
    expect(screen.getByRole("link", { name: "Ver ficha" })).toHaveAttribute("href", "/admin/estadisticas/alumnos/55");

    await usuario.click(screen.getByRole("button", { name: "Dar de alta a otro" }));
    expect(screen.getByLabelText("DNI")).toHaveValue("");
  });

  it("valida antes de mandar y, si el DNI ya existe, ofrece cobrarle a ese alumno", async () => {
    servidorMock.use(
      catalogos,
      http.post(`${API}/personas/registrar`, () =>
        HttpResponse.json({ ok: false, codigo: "DOCUMENTO_DUPLICADO", mensaje: "Ya existe una persona con ese documento" }, { status: 409 }),
      ),
    );
    renderizar(<RegisterAlumnoPage />, { ruta: "/register" });
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("button", { name: "Dar de alta" }));
    expect(await screen.findByText("El DNI tiene que tener entre 6 y 12 números")).toBeInTheDocument();
    expect(screen.getByText("La fecha de nacimiento es obligatoria")).toBeInTheDocument();

    await completar(usuario, { dni: "30111222" });
    expect(await screen.findByText("Ya existe una persona con ese documento")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ya está cargado: cobrarle el plan" })).toHaveAttribute("href", "/admin/pagos/registrar?dni=30111222");
  });

  it("con ?dni= (desde Cobrar plan) el DNI ya viene escrito", async () => {
    servidorMock.use(catalogos);
    renderizar(<RegisterAlumnoPage />, { ruta: "/register?dni=11222333", rutaDelUi: "/register" });

    expect(screen.getByLabelText("DNI")).toHaveValue("11222333");
  });
});
