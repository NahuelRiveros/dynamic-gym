import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock } from "../../test/servidor_mock.js";
import ConsultaPlanPage from "./consulta_plan_page.jsx";
import { estadoDelPlan } from "./estado_plan.js";

const PLAN = { tipoplan_desc: "Mensual", inicio: "2026-10-01", fin: "2026-10-31", ingresos_disponibles: 8, ingresos_ilimitados: false, vigente_hoy: true, dias_restantes: 20 };
const ALUMNO = { nombre: "Carla", apellido: "Activa", documento: "30111222", estado_desc: "Habilitado" };

describe("Mensaje del plan para el alumno", () => {
  it("dice qué hacer en cada caso", () => {
    expect(estadoDelPlan(PLAN).titulo).toBe("¡Tu plan está al día!");
    expect(estadoDelPlan({ ...PLAN, dias_restantes: 1 }).titulo).toBe("Tu plan vence mañana");
    expect(estadoDelPlan({ ...PLAN, dias_restantes: 0 }).titulo).toBe("Tu plan vence hoy");
    expect(estadoDelPlan({ ...PLAN, ingresos_disponibles: 0 }).titulo).toBe("Usaste todos tus ingresos");
    expect(estadoDelPlan({ ...PLAN, vigente_hoy: false, dias_restantes: -3 }).detalle).toContain("Venció el 31/10/2026");
    expect(estadoDelPlan(null).titulo).toBe("Todavía no tenés un plan");
  });

  it("a un plan ilimitado nunca le dice que se quedó sin ingresos", () => {
    expect(estadoDelPlan({ ...PLAN, ingresos_disponibles: 0, ingresos_ilimitados: true }).titulo).toBe("¡Tu plan está al día!");
  });
});

describe("Mi Plan", () => {
  async function consultar(dni) {
    const usuario = userEvent.setup();
    await usuario.type(screen.getByLabelText("Tu DNI"), dni);
    await usuario.click(screen.getByRole("button", { name: "Consultar" }));
    return usuario;
  }

  it("muestra el pase del alumno con sus días e ingresos, y el DNI con puntos", async () => {
    servidorMock.use(http.get(`${API}/consulta/plan/30111222`, () => HttpResponse.json({ ok: true, alumno: ALUMNO, plan_actual: PLAN })));
    renderizar(<ConsultaPlanPage />, { ruta: "/consulta-plan" });

    await consultar("30111222");

    expect(screen.getByLabelText("Tu DNI")).toHaveValue("30.111.222");
    expect(await screen.findByRole("heading", { name: "Carla Activa" })).toBeInTheDocument();
    expect(screen.getByText("Ingresos disponibles").nextSibling).toHaveTextContent("8");
    expect(screen.getByRole("status")).toHaveTextContent("¡Tu plan está al día!");
  });

  it("un plan ilimitado muestra \"Libre\" en vez de un número", async () => {
    servidorMock.use(
      http.get(`${API}/consulta/plan/30454545`, () =>
        HttpResponse.json({ ok: true, alumno: ALUMNO, plan_actual: { ...PLAN, ingresos_disponibles: 0, ingresos_ilimitados: true } }),
      ),
    );
    renderizar(<ConsultaPlanPage />, { ruta: "/consulta-plan" });

    await consultar("30454545");

    expect(await screen.findByText("Libre")).toBeInTheDocument();
    expect(screen.getByText("Entrás cuando quieras")).toBeInTheDocument();
  });

  it("con el plan vencido no muestra ingresos como disponibles", async () => {
    servidorMock.use(
      http.get(`${API}/consulta/plan/30333444`, () =>
        HttpResponse.json({ ok: true, alumno: ALUMNO, plan_actual: { ...PLAN, vigente_hoy: false, dias_restantes: -1 } }),
      ),
    );
    renderizar(<ConsultaPlanPage />, { ruta: "/consulta-plan" });

    await consultar("30333444");

    expect(await screen.findByText("Tu plan está vencido")).toBeInTheDocument();
    expect(screen.getByText("Ingresos disponibles").nextSibling).toHaveTextContent("—");
  });

  it("un DNI que no existe muestra el aviso y permite consultar otro", async () => {
    servidorMock.use(
      http.get(`${API}/consulta/plan/11222333`, () =>
        HttpResponse.json({ ok: false, codigo: "NO_EXISTE", mensaje: "No se encontró ningún alumno con ese DNI" }, { status: 404 }),
      ),
    );
    renderizar(<ConsultaPlanPage />, { ruta: "/consulta-plan" });

    const usuario = await consultar("11222333");

    expect(await screen.findByRole("alert")).toHaveTextContent("No se encontró ningún alumno con ese DNI");
    await usuario.click(screen.getByRole("button", { name: "Consultar otro DNI" }));
    expect(screen.getByLabelText("Tu DNI")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("no consulta con un DNI demasiado corto", async () => {
    renderizar(<ConsultaPlanPage />, { ruta: "/consulta-plan" });
    const usuario = userEvent.setup();

    await usuario.type(screen.getByLabelText("Tu DNI"), "123");

    expect(screen.getByRole("button", { name: "Consultar" })).toBeDisabled();
  });
});
