import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { plata } from "../../lib/dinero.js";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock } from "../../test/servidor_mock.js";
import RegistrarPagoPage from "./registrar_pago_page.jsx";

const PLANES = [
  { id: 1, descripcion: "Mensual", dias_totales: 30, ingresos: 12, precio: "15000", activo: true },
  { id: 2, descripcion: "Pase libre", dias_totales: 30, ingresos: 0, precio: "20000", activo: true },
  { id: 3, descripcion: "Viejo", dias_totales: 30, ingresos: 8, precio: "9000", activo: false },
  { id: 4, descripcion: "Sin precio", dias_totales: 7, ingresos: 7, precio: "0", activo: true },
];
const ALUMNO = { alumno_id: 7, nombre: "Carla", apellido: "Activa", documento: "30111222", estado_id: 1 };

function servidor({ ultimo_pago = null, pedidos = [] } = {}) {
  servidorMock.use(
    http.get(`${API}/planes`, () => HttpResponse.json({ ok: true, data: PLANES })),
    http.get(`${API}/pagos/preview`, ({ request }) => {
      const dni = new URL(request.url).searchParams.get("documento");
      return dni === "30111222"
        ? HttpResponse.json({ ok: true, alumno: ALUMNO, ultimo_pago })
        : HttpResponse.json({ ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" }, { status: 404 });
    }),
    http.post(`${API}/pagos/registrar`, async ({ request }) => {
      pedidos.push(await request.json());
      return HttpResponse.json({
        ok: true,
        alumno: ALUMNO,
        pago: { monto_pagado: 15000, metodo_pago: "TRANSFERENCIA" },
        plan: { tipo_plan_descripcion: "Mensual", inicio: "2026-10-09", fin: "2026-11-07", ingresos_disponibles: 12 },
      });
    }),
  );
  return pedidos;
}

describe("Cobrar plan", () => {
  it("con ?dni= ya aparece el alumno; se elige plan y método y el botón dice cuánto se cobra", async () => {
    const pedidos = servidor();
    renderizar(<RegistrarPagoPage />, { ruta: "/admin/pagos/registrar?dni=30111222", rutaDelUi: "/admin/pagos/registrar" });
    const usuario = userEvent.setup();

    expect(await screen.findByText("Carla Activa")).toBeInTheDocument();
    // Solo planes activos; uno sin precio no se puede elegir.
    expect(await screen.findByLabelText(/Mensual/)).toBeInTheDocument();
    expect(screen.queryByText("Viejo")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Sin precio/, { selector: "input" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Elegí un plan" })).toBeDisabled();

    await usuario.click(screen.getByLabelText(/Mensual/));
    await usuario.click(screen.getByLabelText("Transferencia"));
    await usuario.click(screen.getByRole("button", { name: `Cobrar ${plata(15000)}` }));

    expect(pedidos).toEqual([{ documento: "30111222", tipo_plan_id: 1, monto_pagado: 15000, metodo_pago: "TRANSFERENCIA" }]);
    expect(await screen.findByRole("heading", { name: `Cobrado: ${plata(15000)} en transferencia` })).toBeInTheDocument();
    expect(screen.getByText("Carla Activa ya puede entrar.")).toBeInTheDocument();
  });

  it("avisa cuántos días del plan actual se pierden si todavía está vigente", async () => {
    servidor({ ultimo_pago: { tipo_desc: "Mensual", fin: "2026-10-19", vigente_hoy: true, dias_restantes: 10, ingresos_disponibles: 4, ingresos_ilimitados: false } });
    renderizar(<RegistrarPagoPage />, { ruta: "/admin/pagos/registrar?dni=30111222", rutaDelUi: "/admin/pagos/registrar" });

    expect(await screen.findByRole("note")).toHaveTextContent("Todavía le quedan 10 días del plan actual");
  });

  it("un DNI que no existe ofrece darlo de alta con ese DNI", async () => {
    servidor();
    renderizar(<RegistrarPagoPage />, { ruta: "/admin/pagos/registrar" });
    const usuario = userEvent.setup();

    await usuario.type(screen.getByLabelText("DNI del alumno"), "11222333");
    expect(screen.getByLabelText("DNI del alumno")).toHaveValue("11.222.333");
    await usuario.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No existe una persona con ese documento");
    expect(screen.getByRole("link", { name: "Darlo de alta como alumno nuevo" })).toHaveAttribute("href", "/register?dni=11222333");
  });
});
