import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { Persona } from "../models_v2/index.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let tokenAdmin;
let tokenStaff;

beforeAll(async () => {
  tokenAdmin = await tokenDe(app, USUARIOS_TEST.admin);
  tokenStaff = await tokenDe(app, USUARIOS_TEST.staff);
});
afterAll(() => sequelize.close());

describe("Estadísticas (devuelven nombres y DNI de alumnos)", () => {
  it("sin sesión no se ven y el staff tampoco las ve", async () => {
    expect((await request(app).get("/api/estadisticas/vencimientos")).status).toBe(401);

    const r = await request(app).get("/api/estadisticas/vencimientos").set("Authorization", `Bearer ${tokenStaff}`);
    expect(r.status).toBe(403);
  });
});

describe("Cambio de contraseña por email", () => {
  it("sin sesión, o con sesión de admin, no cambia nada", async () => {
    const pedido = { email: USUARIOS_TEST.staff.email, newPassword: "clave-robada" };

    expect((await request(app).post("/api/auth/reset-password").send(pedido)).status).toBe(401);
    const comoAdmin = await request(app).post("/api/auth/reset-password").set("Authorization", `Bearer ${tokenAdmin}`).send(pedido);
    expect(comoAdmin.status).toBe(403);

    // La contraseña del staff sigue siendo la de siempre
    await expect(tokenDe(app, USUARIOS_TEST.staff)).resolves.toEqual(expect.any(String));
  });
});

describe("Alta de usuarios del sistema", () => {
  const nuevo = (extra) => ({ nombre: "Nora", apellido: "Nueva", password: "clave-nueva-123", roles: [2], ...extra });
  const crear = (token, datos) => request(app).post("/api/admin/usuarios").set("Authorization", `Bearer ${token}`).send(datos);

  it("el staff no puede crear usuarios", async () => {
    const r = await crear(tokenStaff, nuevo({ email: "nora1@test.local", documento: "40000001" }));

    expect(r.status).toBe(403);
  });

  it("el admin crea un usuario staff que puede iniciar sesión", async () => {
    const datos = nuevo({ email: "nora2@test.local", documento: "40000002" });
    const r = await crear(tokenAdmin, datos);

    expect(r.status).toBe(200);
    expect(r.body.usuario.roles).toEqual([{ id: 2, codigo: "staff" }]);
    await expect(tokenDe(app, datos)).resolves.toEqual(expect.any(String));
  });

  it("un admin no puede crear un super admin", async () => {
    const r = await crear(tokenAdmin, nuevo({ email: "nora3@test.local", documento: "40000003", roles: [3] }));

    expect(r.status).toBe(403);
    expect(r.body.codigo).toBe("SIN_PERMISO");
    expect(await Persona.findOne({ where: { email: "nora3@test.local" } })).toBeNull();
  });

  it("con un rol que no existe no deja nada creado a medias", async () => {
    const r = await crear(tokenAdmin, nuevo({ email: "nora4@test.local", documento: "40000004", roles: [2, 99] }));

    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe("ROL_INVALIDO");
    expect(await Persona.findOne({ where: { email: "nora4@test.local" } })).toBeNull();
  });
});
