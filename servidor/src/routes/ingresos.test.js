import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { ALUMNOS_TEST, USUARIOS_TEST } from "../../tests/armar_base.js";

const app = createApp();
let token;

const ingresar = (dni, conToken = token) => {
  const pedido = request(app).post("/api/ingresos/registrar").send({ dni });
  return conToken ? pedido.set("Authorization", `Bearer ${conToken}`) : pedido;
};

beforeAll(async () => {
  const { staff } = USUARIOS_TEST;
  const r = await request(app).post("/api/auth/login").send({ email: staff.email, password: staff.password });
  token = r.body.token;
});
afterAll(() => sequelize.close());

describe("Kiosco · ingreso por DNI", () => {
  it("registra el ingreso, descuenta uno del plan y no deja entrar dos veces el mismo día", async () => {
    const { conPlan } = ALUMNOS_TEST;

    const r = await ingresar(conPlan.documento);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({
      ok: true,
      alumno: { nombre: conPlan.nombre, apellido: conPlan.apellido },
      plan: { ingresos_restantes: conPlan.ingresos - 1 },
    });

    const otraVez = await ingresar(conPlan.documento);
    expect(otraVez.status).toBe(409);
    expect(otraVez.body.codigo).toBe("YA_INGRESO_HOY");
  });

  it("acepta el DNI con puntos, como lo escribe la gente", async () => {
    const { sinIngresos } = ALUMNOS_TEST;
    const conPuntos = sinIngresos.documento.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2.$3");

    const r = await ingresar(conPuntos);
    expect(r.body.codigo).toBe("SIN_INGRESOS");
  });

  it.each([
    ["un plan vencido", ALUMNOS_TEST.vencido.documento, 409, "PLAN_VENCIDO_O_INEXISTENTE"],
    ["un plan sin ingresos", ALUMNOS_TEST.sinIngresos.documento, 409, "SIN_INGRESOS"],
    ["un DNI que no existe", "11222333", 404, "NO_EXISTE"],
    ["un DNI con letras", "12ab", 400, "VALIDACION"],
  ])("rechaza %s con un código claro", async (_caso, dni, status, codigo) => {
    const r = await ingresar(dni);

    expect(r.status).toBe(status);
    expect(r.body).toMatchObject({ ok: false, codigo });
  });

  it("sin sesión de staff o admin no registra nada", async () => {
    const r = await ingresar(ALUMNOS_TEST.conPlan.documento, null);

    expect(r.status).toBe(401);
  });
});
