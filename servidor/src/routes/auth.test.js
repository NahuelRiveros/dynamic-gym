import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";

const app = createApp();
const { admin, staff } = USUARIOS_TEST;

afterAll(() => sequelize.close());

describe("Auth", () => {
  it("login correcto devuelve el token y los roles", async () => {
    const r = await request(app).post("/api/auth/login").send({ email: admin.email, password: admin.password });

    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, usuario: { email: admin.email, roles: ["admin"] } });
    expect(r.body.token).toEqual(expect.any(String));
  });

  it("con la contraseña incorrecta responde 401 sin decir cuál dato falló", async () => {
    const r = await request(app).post("/api/auth/login").send({ email: staff.email, password: "otra-clave" });

    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({ ok: false, codigo: "CREDENCIALES_INVALIDAS" });
    expect(r.body.token).toBeUndefined();
  });

  it("/me pide sesión y con token devuelve el usuario", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);

    const { body } = await request(app).post("/api/auth/login").send({ email: staff.email, password: staff.password });
    const r = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);

    expect(r.status).toBe(200);
    expect(r.body.usuario).toMatchObject({ nombre: staff.nombre, apellido: staff.apellido, roles: ["staff"] });
  });
});

describe("Salud", () => {
  it("/health responde que el servidor y la base funcionan", async () => {
    const r = await request(app).get("/api/health");

    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});
