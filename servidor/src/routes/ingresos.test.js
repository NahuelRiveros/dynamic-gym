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

// Cada caso con su propio alumno (los tests comparten la base). `estado`: 1 habilitado, 2 restringido.
async function alumnoCon({ dni, ingresosPlan = 12, disponibles, diasPlan = 30, estado = 1 }) {
  const [[plan]] = await sequelize.query(
    "INSERT INTO gym_v3.plan_tipo (descripcion, dias_totales, ingresos, precio, activo) VALUES (:d, 30, :i, 0, TRUE) RETURNING id",
    { replacements: { d: `Plan ${dni}`, i: ingresosPlan } },
  );
  const [[persona]] = await sequelize.query(
    "INSERT INTO gym_v3.persona (tipo_documento_id, nombre, apellido, documento) VALUES (1, 'Test', 'Ingreso', :dni) RETURNING id",
    { replacements: { dni } },
  );
  const [[alumno]] = await sequelize.query("INSERT INTO gym_v3.alumno (persona_id, estado_id) VALUES (:p, :e) RETURNING id", {
    replacements: { p: persona.id, e: estado },
  });
  const inicio = diasPlan < 0 ? diasPlan - 30 : 0;
  await sequelize.query(
    `INSERT INTO gym_v3.membresia (alumno_id, plan_tipo_id, fecha_inicio, fecha_fin, dias_totales, ingresos_disponibles)
     VALUES (:a, :p, CURRENT_DATE + :ini::int, CURRENT_DATE + :fin::int, 30, :disp)`,
    { replacements: { a: alumno.id, p: plan.id, ini: inicio, fin: diasPlan, disp: disponibles } },
  );
  return alumno.id;
}
const estadoDe = async (id) => (await sequelize.query("SELECT estado_id FROM gym_v3.alumno WHERE id = :id", { replacements: { id }, type: "SELECT" }))[0].estado_id;

describe("Kiosco · reglas del ingreso", () => {
  it("con el último ingreso entra, queda en 0 y restringido", async () => {
    const id = await alumnoCon({ dni: "51000001", disponibles: 1 });
    const r = await ingresar("51000001");

    expect(r.body).toMatchObject({ ok: true, mensaje: "Ingreso registrado - alumno quedó restringido", alumno: { estado_id: 2 }, plan: { ingresos_restantes: 0 } });
    expect(await estadoDe(id)).toBe(2);
  });

  it("un restringido con ingresos vuelve a quedar habilitado al entrar", async () => {
    const id = await alumnoCon({ dni: "51000002", disponibles: 5, estado: 2 });
    const r = await ingresar("51000002");

    expect(r.body).toMatchObject({ ok: true, alumno: { estado_id: 1 }, plan: { ingresos_restantes: 4 } });
    expect(await estadoDe(id)).toBe(1);
  });

  it("un plan ilimitado entra sin descontar y con su nombre de plan", async () => {
    await alumnoCon({ dni: "51000003", ingresosPlan: 0, disponibles: 0 });
    const r = await ingresar("51000003");

    expect(r.body).toMatchObject({ ok: true, mensaje: "Ingreso registrado", plan: { ingresos_restantes: null, tipo_plan: "Plan 51000003" } });
  });

  it("un plan vencido no entra y el alumno queda restringido", async () => {
    const id = await alumnoCon({ dni: "51000004", disponibles: 10, diasPlan: -2 });
    const r = await ingresar("51000004");

    expect(r.body).toMatchObject({ ok: false, codigo: "PLAN_VENCIDO_O_INEXISTENTE", alumno: { estado_id: 2 } });
    expect(await estadoDe(id)).toBe(2);
  });

  it("dos ingresos al mismo tiempo del mismo alumno: entra uno solo y descuenta uno", async () => {
    await alumnoCon({ dni: "51000005", disponibles: 5 });
    const respuestas = await Promise.all([ingresar("51000005"), ingresar("51000005")]);

    expect(respuestas.map((r) => r.body.codigo).sort()).toEqual(["OK", "YA_INGRESO_HOY"]);
    const [{ disp }] = await sequelize.query(
      "SELECT m.ingresos_disponibles AS disp FROM gym_v3.membresia m JOIN gym_v3.alumno a ON a.id = m.alumno_id JOIN gym_v3.persona p ON p.id = a.persona_id WHERE p.documento = '51000005'",
      { type: "SELECT" },
    );
    expect(disp).toBe(4);
  });
});
