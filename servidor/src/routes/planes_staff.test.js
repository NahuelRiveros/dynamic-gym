import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let tokenAdmin;
let tokenStaff;
const con = (token) => (pedido) => pedido.set("Authorization", `Bearer ${token}`);

beforeAll(async () => {
  tokenAdmin = await tokenDe(app, USUARIOS_TEST.admin);
  tokenStaff = await tokenDe(app, USUARIOS_TEST.staff);
});
afterAll(() => sequelize.close());

describe("Planes", () => {
  const PLAN = { descripcion: "Pase libre trimestral", dias_totales: 90, ingresos: 0, precio: 40000 };

  it("el admin crea un plan y aparece al instante en los catálogos (la caché se limpia)", async () => {
    const antes = await request(app).get("/api/catalogos");
    expect(antes.body.tiposPlan.map((p) => p.label)).not.toContain(PLAN.descripcion);

    const r = await con(tokenAdmin)(request(app).post("/api/planes")).send(PLAN);
    expect(r.status).toBe(201);

    const despues = await request(app).get("/api/catalogos");
    expect(despues.body.tiposPlan.map((p) => p.label)).toContain(PLAN.descripcion);
  });

  it("no repite descripciones, avisa los errores por campo y no acepta 0 días", async () => {
    const repetido = await con(tokenAdmin)(request(app).post("/api/planes")).send(PLAN);
    expect(repetido.status).toBe(409);

    const invalido = await con(tokenAdmin)(request(app).post("/api/planes")).send({ descripcion: "X", dias_totales: 0, ingresos: 1, precio: 1 });
    expect(invalido.status).toBe(400);
    expect(invalido.body.errores).toEqual([
      "La descripción debe tener al menos 3 caracteres",
      "Los días totales deben ser un número entero mayor a 0",
    ]);
  });

  it("el staff ve los planes pero no los puede crear", async () => {
    expect((await con(tokenStaff)(request(app).get("/api/planes"))).status).toBe(200);
    expect((await con(tokenStaff)(request(app).post("/api/planes")).send(PLAN)).status).toBe(403);
  });

  it("un plan con pagos se desactiva (no se borra) y sale de los catálogos", async () => {
    const estado = (id, body) => con(tokenAdmin)(request(app).patch(`/api/planes/${id}/estado`)).send(body);

    expect((await estado(1, { activo: "no" })).status).toBe(400);
    expect((await estado("abc", { activo: false })).status).toBe(400);
    expect((await estado(999, { activo: false })).status).toBe(404);

    const r = await estado(1, { activo: false });
    expect(r.status).toBe(200);
    expect(r.body.mensaje).toBe("El plan está en uso, por eso se desactivó en lugar de borrarse");
    const catalogos = await request(app).get("/api/catalogos");
    expect(catalogos.body.tiposPlan.map((p) => p.value)).not.toContain(1);

    await estado(1, { activo: true });
  });
});

describe("Staff", () => {
  const STAFF = { nombre: "Tomás", apellido: "Turno", documento: "41000001", email: "tomas@test.local", password: "clave-tomas-123" };

  it("el admin da de alta un staff; desactivado ya no puede iniciar sesión", async () => {
    const alta = await con(tokenAdmin)(request(app).post("/api/staff")).send(STAFF);
    expect(alta.status).toBe(201);
    await expect(tokenDe(app, STAFF)).resolves.toEqual(expect.any(String));

    const lista = await con(tokenAdmin)(request(app).get("/api/staff"));
    const usuarioId = lista.body.data.find((s) => s.gym_persona_email === STAFF.email).gym_usuario_id;

    const baja = await con(tokenAdmin)(request(app).patch(`/api/staff/${usuarioId}/estado`)).send({ activo: false });
    expect(baja.status).toBe(200);

    const login = await request(app).post("/api/auth/login").send({ email: STAFF.email, password: STAFF.password });
    expect(login.status).toBe(401);
    expect(login.body.codigo).toBe("USUARIO_INACTIVO");
  });

  it("valida el id y el estado, y el staff no administra staff", async () => {
    expect((await con(tokenAdmin)(request(app).patch("/api/staff/abc/estado")).send({ activo: true })).status).toBe(400);
    expect((await con(tokenAdmin)(request(app).patch("/api/staff/1/estado")).send({ activo: "si" })).status).toBe(400);
    expect((await con(tokenStaff)(request(app).get("/api/staff"))).status).toBe(403);
  });
});

describe("Recaudación", () => {
  it("el admin ve el resumen anual; el mes se valida; el staff no la ve", async () => {
    const r = await con(tokenAdmin)(request(app).get("/api/recaudacion/mensual").query({ anio: 2026 }));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, anio: 2026, items: expect.any(Array) });

    const mesMal = await con(tokenAdmin)(request(app).get("/api/recaudacion/dias").query({ anio: 2026, mes: 13 }));
    expect(mesMal.status).toBe(400);
    expect(mesMal.body.mensaje).toBe("anio y mes son obligatorios (mes 1..12)");

    expect((await con(tokenStaff)(request(app).get("/api/recaudacion/mensual").query({ anio: 2026 }))).status).toBe(403);
  });

  it("el detalle de un día responde con el mismo formato de siempre", async () => {
    const r = await con(tokenAdmin)(request(app).get("/api/recaudacion/detalle-dia").query({ anio: 2026, mes: 1, dia: 15 }));

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, anio: 2026, mes: 1, dia: 15 });
  });
});
