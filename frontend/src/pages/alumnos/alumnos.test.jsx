import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { edad } from "../../lib/fecha_ar.js";
import { situacionDelPlan } from "../../lib/situacion_plan.js";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock, sesionComo } from "../../test/servidor_mock.js";
import FichaAlumnoPage from "./ficha_alumno_page.jsx";
import ListaAlumnosPage from "./lista_alumnos_page.jsx";

const fila = (id, apellido, plan = {}) => ({
  gym_alumno_id: id,
  gym_persona_nombre: "Ana",
  gym_persona_apellido: apellido,
  gym_persona_documento: `3000000${id}`,
  estado_desc: "Habilitado",
  plan_id: 100 + id,
  plan_tipo_desc: "Mensual",
  plan_fin: "2026-11-08",
  tiene_plan_vigente: true,
  ingresos_disponibles: 8,
  ingresos_ilimitados: false,
  dias_restantes: 30,
  ...plan,
});
const respuesta = (items) => HttpResponse.json({ ok: true, items, pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 } });
const otrasRutas = { "/admin/pagos/registrar": "Pantalla de cobro", "/admin/estadisticas/alumnos/:id": "Ficha" };

describe("Situación del plan (la misma en Mi Plan, la lista y la ficha)", () => {
  it("prioriza lo que le impide entrar hoy", () => {
    const vigente = { vigente_hoy: true, ingresos_disponibles: 5, ingresos_ilimitados: false, dias_restantes: 20 };
    expect(situacionDelPlan(vigente).etiqueta).toBe("Al día");
    expect(situacionDelPlan({ ...vigente, dias_restantes: 3 }).etiqueta).toBe("Vence en 3 días");
    expect(situacionDelPlan({ ...vigente, ingresos_disponibles: 0, dias_restantes: 3 }).etiqueta).toBe("Sin ingresos");
    expect(situacionDelPlan({ ...vigente, ingresos_disponibles: 0, ingresos_ilimitados: true }).etiqueta).toBe("Al día");
    expect(situacionDelPlan({ ...vigente, vigente_hoy: false }).etiqueta).toBe("Vencido");
    expect(situacionDelPlan(null).etiqueta).toBe("Sin plan");
  });

  it("calcula la edad con la fecha de hoy en Argentina", () => {
    const hoy = { anio: 2026, mes: 10, dia: 9 };
    expect(edad("2000-10-09", hoy)).toBe(26);
    expect(edad("2000-10-10", hoy)).toBe(25);
    expect(edad(null, hoy)).toBeNull();
  });
});

describe("Lista de alumnos", () => {
  it("muestra una sola situación por alumno, y \"Libre\" en los planes ilimitados", async () => {
    servidorMock.use(
      http.get(`${API}/alumnos/listado`, () =>
        respuesta([
          fila(1, "Pérez"),
          fila(2, "Gómez", { dias_restantes: 2 }),
          fila(3, "Ruiz", { tiene_plan_vigente: false, dias_restantes: -4 }),
          fila(4, "Sosa", { ingresos_disponibles: 0, ingresos_ilimitados: true }),
        ]),
      ),
    );
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos" });

    expect(await screen.findAllByText("Al día")).toHaveLength(2);
    expect(screen.getAllByText("Vence en 2 días").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vencido").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Libre").length).toBeGreaterThan(0);
    // El staff no ve el botón técnico de recalcular estados.
    expect(screen.queryByRole("button", { name: /Recalcular/ })).not.toBeInTheDocument();
  });

  it("busca en el servidor recién cuando se deja de escribir, y el filtro y el orden van al servidor", async () => {
    const pedidos = [];
    servidorMock.use(
      http.get(`${API}/alumnos/listado`, ({ request }) => {
        const params = Object.fromEntries(new URL(request.url).searchParams);
        pedidos.push(params);
        return respuesta(params.q ? [fila(2, "Gómez")] : [fila(1, "Pérez"), fila(2, "Gómez")]);
      }),
    );
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos" });
    const usuario = userEvent.setup();

    expect((await screen.findAllByText(/Pérez/)).length).toBeGreaterThan(0);
    await usuario.type(screen.getByRole("searchbox"), "gom");
    await waitFor(() => expect(screen.queryByText(/Pérez/)).not.toBeInTheDocument());
    expect(pedidos.map((p) => p.q ?? "")).toEqual(["", "gom"]);

    await usuario.click(screen.getByRole("button", { name: "Con plan vigente" }));
    await usuario.selectOptions(screen.getByLabelText("Ordenar por"), "vence");
    await waitFor(() => expect(pedidos.at(-1)).toMatchObject({ plan_vigente: "true", sort: "vencimiento", order: "asc", page: "1" }));
    expect(screen.getByRole("button", { name: "Con plan vigente" })).toHaveAttribute("aria-pressed", "true");
  });

  it("\"Cobrar\" en una fila lleva a cobrarle con su DNI, sin abrir la ficha", async () => {
    servidorMock.use(http.get(`${API}/alumnos/listado`, () => respuesta([fila(1, "Pérez")])));
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos", otrasRutas });

    const [boton] = await screen.findAllByRole("button", { name: "Cobrar" });
    await userEvent.setup().click(boton);

    expect(await screen.findByText("Pantalla de cobro")).toBeInTheDocument();
  });

  it("si falla muestra el error y deja reintentar", async () => {
    let falla = true;
    servidorMock.use(
      http.get(`${API}/alumnos/listado`, () => (falla ? HttpResponse.json({ ok: false, mensaje: "Servidor ocupado" }, { status: 500 }) : respuesta([fila(1, "Pérez")]))),
    );
    sesionComo({ roles: ["staff"] });
    renderizar(<ListaAlumnosPage />, { ruta: "/admin/estadisticas/alumnos" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor ocupado");
    falla = false;
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
    expect((await screen.findAllByText(/Pérez/)).length).toBeGreaterThan(0);
  });
});

describe("Ficha del alumno", () => {
  const ficha = (planActual) => ({
    ok: true,
    alumno: {
      gym_alumno_id: 7,
      gym_persona_nombre: "Carla",
      gym_persona_apellido: "Activa",
      gym_persona_documento: "30111222",
      gym_persona_celular: "3704111222",
      gym_persona_fechanacimiento: "1995-03-02",
      estado_desc: "Habilitado",
    },
    plan_actual: planActual,
    planes: planActual ? [{ plan_id: 9, tipoplan_desc: "Mensual", inicio: "2026-10-09", fin: "2026-11-08", monto_pagado: 15000, metodo_pago: "EFECTIVO" }] : [],
    resumen: { total_pagos: planActual ? 1 : 0, total_recaudado: planActual ? 15000 : 0 },
  });

  it("muestra la situación del plan y las acciones con el DNI ya cargado", async () => {
    servidorMock.use(
      http.get(`${API}/alumnos/detalle/7`, () =>
        HttpResponse.json(ficha({ plan_id: 9, tipoplan_desc: "Mensual", inicio: "2026-10-09", fin: "2026-11-08", vigente_hoy: true, ingresos_disponibles: 0, ingresos_ilimitados: false, dias_restantes: 30 })),
      ),
    );
    sesionComo({ roles: ["admin"] });
    renderizar(<FichaAlumnoPage />, { ruta: "/admin/estadisticas/alumnos/7", rutaDelUi: "/admin/estadisticas/alumnos/:id" });

    expect(await screen.findByRole("heading", { name: "Carla Activa" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Plan actual" })).getByText("Sin ingresos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cobrar / renovar plan" })).toHaveAttribute("href", "/admin/pagos/registrar?dni=30111222");
    expect(screen.getByRole("link", { name: "Corregir plan o datos" })).toHaveAttribute("href", "/admin/alumnos/editar-plan?dni=30111222");
    expect(screen.getByRole("link", { name: "3704111222" })).toHaveAttribute("href", "tel:3704111222");
    expect(screen.getByRole("link", { name: "Alumnos" })).toHaveAttribute("href", "/admin/estadisticas/alumnos");
  });

  it("al staff no le muestra \"Corregir plan\", y sin planes ofrece cobrarle el primero", async () => {
    servidorMock.use(http.get(`${API}/alumnos/detalle/7`, () => HttpResponse.json(ficha(null))));
    sesionComo({ roles: ["staff"] });
    renderizar(<FichaAlumnoPage />, { ruta: "/admin/estadisticas/alumnos/7", rutaDelUi: "/admin/estadisticas/alumnos/:id" });

    expect(await screen.findByText("Todavía no tiene ningún plan.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cobrarle el primero" })).toHaveAttribute("href", "/admin/pagos/registrar?dni=30111222");
    expect(screen.queryByRole("link", { name: /Corregir plan/ })).not.toBeInTheDocument();
    expect(screen.getByText("Todavía no tiene pagos registrados.")).toBeInTheDocument();
  });
});
