import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let token;
const comoStaff = (pedido) => pedido.set("Authorization", `Bearer ${token}`);

const NUEVO = { nombre: "Gina", apellido: "Nueva", documento: "35.123.456", email: "Gina@Test.local", tipo_documento_id: 1, tipo_persona_id: 1, sexo_id: null };
const hoyArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

beforeAll(async () => {
  token = await tokenDe(app, USUARIOS_TEST.staff);
});
afterAll(() => sequelize.close());

describe("Alta de alumno → pago → ingreso por el kiosco", () => {
  let alumnoId;

  it("el staff registra un alumno nuevo (queda pendiente hasta que pague)", async () => {
    const r = await comoStaff(request(app).post("/api/personas/registrar")).send(NUEVO);

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, persona: { documento: "35123456" }, alumno: { estado_id: 3 } });
    alumnoId = r.body.alumno.alumno_id;
  });

  it("no deja registrar dos veces el mismo DNI ni un alta sin apellido", async () => {
    const repetido = await comoStaff(request(app).post("/api/personas/registrar")).send({ ...NUEVO, email: null });
    expect(repetido.status).toBe(409);
    expect(repetido.body.codigo).toBe("DOCUMENTO_DUPLICADO");

    const sinApellido = await comoStaff(request(app).post("/api/personas/registrar")).send({ nombre: "X", documento: "35999999" });
    expect(sinApellido.status).toBe(400);
    expect(sinApellido.body).toMatchObject({ codigo: "VALIDACION", mensaje: "nombre, apellido y documento son obligatorios" });
  });

  it("la vista previa del pago encuentra al alumno por DNI (con puntos) y todavía no tiene pagos", async () => {
    const r = await comoStaff(request(app).get("/api/pagos/preview").query({ documento: NUEVO.documento }));

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, alumno: { alumno_id: alumnoId, nombre: "Gina" }, ultimo_pago: null });

    const noExiste = await comoStaff(request(app).get("/api/pagos/preview").query({ documento: "11111111" }));
    expect(noExiste.status).toBe(404);
  });

  it("registra el pago: el plan empieza hoy (hora argentina), el alumno queda habilitado y entra por el kiosco", async () => {
    const pago = await comoStaff(request(app).post("/api/pagos/registrar")).send({
      documento: "35123456", tipo_plan_id: 1, monto_pagado: 15000, metodo_pago: "efectivo",
    });

    expect(pago.status).toBe(200);
    expect(pago.body).toMatchObject({ ok: true, alumno: { estado_id: 1 }, plan: { inicio: hoyArgentina(), dias_totales: 30, ingresos_disponibles: 12 } });

    const ingreso = await comoStaff(request(app).post("/api/ingresos/registrar")).send({ dni: "35123456" });
    expect(ingreso.status).toBe(200);
    expect(ingreso.body.plan.ingresos_restantes).toBe(11);
  });

  it("después del pago, la vista previa avisa que tiene un plan vigente y cuántos días le quedan", async () => {
    const r = await comoStaff(request(app).get("/api/pagos/preview").query({ documento: "35123456" }));

    // 30 días contando hoy: vence dentro de 29.
    expect(r.body.ultimo_pago).toMatchObject({ vigente_hoy: true, dias_restantes: 29, ingresos_ilimitados: false, ingresos_disponibles: 11 });
  });

  it.each([
    ["sin monto", { monto_pagado: 0 }, 400, "VALIDACION"],
    ["sin método de pago", { metodo_pago: " " }, 400, "VALIDACION"],
    ["un plan que no existe", { tipo_plan_id: 999 }, 404, "PLAN_NO_EXISTE"],
  ])("rechaza un pago %s", async (_caso, cambio, status, codigo) => {
    const r = await comoStaff(request(app).post("/api/pagos/registrar")).send({
      documento: "35123456", tipo_plan_id: 1, monto_pagado: 15000, metodo_pago: "efectivo", ...cambio,
    });

    expect(r.status).toBe(status);
    expect(r.body.codigo).toBe(codigo);
  });
});

describe("Listado y detalle de alumnos", () => {
  it("busca por apellido y pagina", async () => {
    const r = await comoStaff(request(app).get("/api/alumnos/listado").query({ q: "Activa", limit: 5 }));

    expect(r.status).toBe(200);
    expect(r.body.items.map((a) => a.gym_persona_apellido)).toEqual(["Activa"]);
    expect(r.body.pagination).toMatchObject({ page: 1, limit: 5, total: 1 });
  });

  it("cada alumno trae los días que le quedan y si su plan es ilimitado; también en la ficha", async () => {
    const lista = await comoStaff(request(app).get("/api/alumnos/listado").query({ q: "Activa" }));
    const [carla] = lista.body.items;
    // El plan de prueba empieza hoy y dura 30 días (setup): vence dentro de 30.
    expect(carla).toMatchObject({ dias_restantes: 30, ingresos_ilimitados: false, tiene_plan_vigente: true });

    const ficha = await comoStaff(request(app).get(`/api/alumnos/detalle/${carla.gym_alumno_id}`));
    expect(ficha.body.plan_actual).toMatchObject({ dias_restantes: 30, ingresos_ilimitados: false, vigente_hoy: true });
    expect(ficha.body.planes[0]).toHaveProperty("ingresos_ilimitados", false);
  });

  it("ordena por vencimiento cuando se pide (los que vencen antes primero)", async () => {
    const r = await comoStaff(request(app).get("/api/alumnos/listado").query({ sort: "vencimiento", order: "asc", limit: 100 }));
    const dias = r.body.items.map((a) => a.dias_restantes).filter((d) => d !== null);

    expect(dias).toEqual([...dias].sort((x, y) => x - y));
  });

  it("un _ o % en la búsqueda se busca como texto, no como comodín", async () => {
    const r = await comoStaff(request(app).get("/api/alumnos/listado").query({ q: "_" }));

    expect(r.body.items).toEqual([]);
  });

  it("el detalle pide un id válido", async () => {
    const r = await comoStaff(request(app).get("/api/alumnos/detalle/abc"));

    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe("VALIDACION");
  });

  it("los cumpleaños responden aunque no haya ninguno cerca", async () => {
    const r = await comoStaff(request(app).get("/api/alumnos/cumples").query({ dias: 3 }));

    expect(r.status).toBe(200);
  });
});
