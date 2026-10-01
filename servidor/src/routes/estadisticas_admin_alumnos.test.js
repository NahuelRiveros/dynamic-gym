import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { QueryTypes } from "sequelize";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { ALUMNOS_TEST, USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let token;
const comoAdmin = (pedido) => pedido.set("Authorization", `Bearer ${token}`);
const hoyArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());

beforeAll(async () => {
  token = await tokenDe(app, USUARIOS_TEST.admin);
});
afterAll(() => sequelize.close());

describe("Estadísticas", () => {
  it("vencimientos de los próximos días: aparecen los planes que vencen en ese rango", async () => {
    const r = await comoAdmin(request(app).get("/api/estadisticas/vencimientos").query({ dias: 31 }));

    expect(r.status).toBe(200);
    expect(r.body.dias).toBe(31);
    expect(r.body.items.map((v) => v.documento)).toContain(ALUMNOS_TEST.conPlan.documento);
  });

  it("sin fechas usa el mes actual; una fecha borrada cuenta como sin fecha; una mal escrita da 400", async () => {
    const sinFechas = await comoAdmin(request(app).get("/api/estadisticas/asistencias_horas_dia"));
    expect(sinFechas.status).toBe(200);
    expect(sinFechas.body.desde).toMatch(/^\d{4}-\d{2}-01$/);
    expect(sinFechas.body.dias).toHaveLength(7);

    const borrada = await comoAdmin(request(app).get("/api/estadisticas/alumnos_Nuevos").query({ desde: "", hasta: "" }));
    expect(borrada.status).toBe(200);

    const mal = await comoAdmin(request(app).get("/api/estadisticas/asistencias").query({ desde: "hola" }));
    expect(mal.status).toBe(400);
    expect(mal.body.mensaje).toBe("desde tiene que ser una fecha AAAA-MM-DD");
  });

  it("planes populares: el año va como parámetro y uno inválido da 400 (antes, Error interno)", async () => {
    const r = await comoAdmin(request(app).get("/api/estadisticas/planes-populares").query({ anio: new Date().getFullYear() }));
    expect(r.status).toBe(200);
    expect(r.body.items[0]).toMatchObject({ plan: expect.any(String), total_ventas: expect.any(Number) });

    const mal = await comoAdmin(request(app).get("/api/estadisticas/planes-populares").query({ anio: "1999; DROP TABLE x" }));
    expect(mal.status).toBe(400);
  });
});

describe("Admin · plan vigente y datos del alumno", () => {
  const vencido = ALUMNOS_TEST.ajusteManual;

  it("busca el plan vigente por DNI", async () => {
    const r = await comoAdmin(request(app).get("/api/admin/alumnos/actualizar-plan").query({ documento: vencido.documento }));

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, alumno: { documento: vencido.documento }, plan: { tipo_plan_id: 1 } });
  });

  it("al ajustar el plan a mano: vence hoy → habilitado (hora argentina) y el historial guarda el estado anterior real", async () => {
    const [antes] = await sequelize.query(
      "SELECT a.id, a.estado_id FROM gym_v3.alumno a JOIN gym_v3.persona p ON p.id = a.persona_id WHERE p.documento = :dni",
      { replacements: { dni: vencido.documento }, type: QueryTypes.SELECT },
    );

    const r = await comoAdmin(request(app).put("/api/admin/alumnos/actualizar-plan")).send({
      documento: vencido.documento, tipo_plan_id: 1, fecha_inicio: hoyArgentina(), fecha_fin: hoyArgentina(), ingresos_disponibles: 5,
    });
    expect(r.status).toBe(200);
    expect(r.body.alumno.estado_id).toBe(1);

    const [log] = await sequelize.query(
      "SELECT estado_anterior_id, estado_nuevo_id FROM gym_v3.alumno_estado_log WHERE alumno_id = :id ORDER BY id DESC LIMIT 1",
      { replacements: { id: antes.id }, type: QueryTypes.SELECT },
    );
    expect(log).toEqual({ estado_anterior_id: antes.estado_id, estado_nuevo_id: 1 });
  });

  it("rechaza fechas mal escritas o invertidas", async () => {
    const base = { documento: vencido.documento, tipo_plan_id: 1 };
    const mal = await comoAdmin(request(app).put("/api/admin/alumnos/actualizar-plan")).send({ ...base, fecha_inicio: "1/1/2026", fecha_fin: "2026-02-01" });
    expect(mal.status).toBe(400);

    const invertidas = await comoAdmin(request(app).put("/api/admin/alumnos/actualizar-plan")).send({ ...base, fecha_inicio: "2026-03-01", fecha_fin: "2026-02-01" });
    expect(invertidas.status).toBe(400);
    expect(invertidas.body.mensaje).toBe("fecha_fin no puede ser menor a fecha_inicio");
  });

  it("guarda los celulares como texto, con + y espacios (antes quedaban vacíos)", async () => {
    const r = await comoAdmin(request(app).patch("/api/admin/alumnos/actualizar-persona")).send({
      documento: vencido.documento, nombre: vencido.nombre, apellido: vencido.apellido,
      celular: "+54 9 370 412-3456", celular_emergencia: "",
    });

    expect(r.status).toBe(200);
    expect(r.body.persona).toMatchObject({ celular: "+54 9 370 412-3456", celular_emergencia: null });
  });
});
