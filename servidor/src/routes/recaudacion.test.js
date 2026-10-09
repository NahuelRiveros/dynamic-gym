import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let tokenAdmin;
const comoAdmin = (pedido) => pedido.set("Authorization", `Bearer ${tokenAdmin}`);

// Un día propio (año 2029) para no mezclarse con los datos de otros tests.
const ANIO = 2029;
const MES = 5;
const DIA = 10;

beforeAll(async () => {
  tokenAdmin = await tokenDe(app, USUARIOS_TEST.admin);

  const [[persona]] = await sequelize.query(
    "INSERT INTO gym_v3.persona (tipo_documento_id, nombre, apellido, documento) VALUES (1, 'Caja', 'Prueba', '30787878') RETURNING id",
  );
  const [[alumno]] = await sequelize.query("INSERT INTO gym_v3.alumno (persona_id, estado_id) VALUES (:id, 1) RETURNING id", {
    replacements: { id: persona.id },
  });
  // Dos planes cobrados ese día: uno en efectivo y otro por transferencia (escrito en minúsculas a propósito).
  await sequelize.query(
    `INSERT INTO gym_v3.membresia (alumno_id, plan_tipo_id, fecha_inicio, fecha_fin, dias_totales, ingresos_disponibles, monto_pagado, metodo_pago)
     VALUES (:a, 1, '2029-05-10', '2029-06-08', 30, 12, 10000, 'EFECTIVO'),
            (:a, 1, '2029-05-10', '2029-06-08', 30, 12, 8000, ' transferencia ')`,
    { replacements: { a: alumno.id } },
  );

  const [[producto]] = await sequelize.query(
    "INSERT INTO gym_v3.producto (nombre, precio_venta, stock_actual) VALUES ('Agua test', 1000, 50) RETURNING id",
  );
  const [[usuario]] = await sequelize.query(
    "SELECT u.id FROM gym_v3.usuario u JOIN gym_v3.persona p ON p.id = u.persona_id WHERE p.email = :email",
    { replacements: { email: USUARIOS_TEST.admin.email } },
  );
  // 2 aguas en efectivo a la tarde; 1 a las 23:30 de Argentina (02:30 UTC del día siguiente): es del día 10.
  // Una reposición (entrada) no es plata que entró: no tiene que sumar.
  await sequelize.query(
    `INSERT INTO gym_v3.movimiento_stock (producto_id, tipo, cantidad, precio_unitario, metodo_pago, registrado_por_id, creado_en)
     VALUES (:p, 'venta', 2, 1000, 'EFECTIVO', :u, '2029-05-10 18:00:00-03'),
            (:p, 'venta', 1, 1000, 'MERCADO PAGO', :u, '2029-05-11 02:30:00+00'),
            (:p, 'entrada', 10, 1000, NULL, :u, '2029-05-10 09:00:00-03')`,
    { replacements: { p: producto.id, u: usuario.id } },
  );
});
afterAll(() => sequelize.close());

describe("Recaudación: planes + productos", () => {
  it("el año suma planes y productos de cada mes", async () => {
    const r = await comoAdmin(request(app).get("/api/recaudacion/mensual").query({ anio: ANIO }));

    expect(r.status).toBe(200);
    expect(r.body.items).toHaveLength(12);
    expect(r.body.items[MES - 1]).toEqual({ mes: MES, planes: 18000, productos: 3000, total: 21000 });
    expect(r.body.items[MES].total).toBe(0);
  });

  it("el mes trae cada día y cuánto entró por método de pago (sin importar cómo se escribió)", async () => {
    const r = await comoAdmin(request(app).get("/api/recaudacion/dias").query({ anio: ANIO, mes: MES }));

    expect(r.body.items).toEqual([{ dia: "2029-05-10", planes: 18000, productos: 3000, total: 21000 }]);
    expect(r.body.metodos).toEqual([
      { metodo: "EFECTIVO", total: 12000 },
      { metodo: "TRANSFERENCIA", total: 8000 },
      { metodo: "MERCADO PAGO", total: 1000 },
    ]);
  });

  it("el detalle del día separa cobros de planes y ventas, con el cierre por método", async () => {
    const r = await comoAdmin(request(app).get("/api/recaudacion/detalle-dia").query({ anio: ANIO, mes: MES, dia: DIA }));

    expect(r.body).toMatchObject({ total_dia: 21000, total_planes: 18000, total_productos: 3000, cantidad_cobros: 2 });
    expect(r.body.items.map((c) => c.metodo_pago)).toEqual(["EFECTIVO", "TRANSFERENCIA"]);
    expect(r.body.items[0]).not.toHaveProperty("fecha_hora"); // la hora no era la del cobro
    expect(r.body.ventas).toEqual([
      expect.objectContaining({ producto: "Agua test", cantidad: 2, monto: 2000, metodo_pago: "EFECTIVO", usuario: "Ana Admin" }),
      expect.objectContaining({ cantidad: 1, monto: 1000, metodo_pago: "MERCADO PAGO" }),
    ]);
    expect(r.body.metodos[0]).toEqual({ metodo: "EFECTIVO", total: 12000 });
  });

  it("un día sin movimiento responde vacío, y una fecha inválida da 400", async () => {
    const vacio = await comoAdmin(request(app).get("/api/recaudacion/detalle-dia").query({ anio: ANIO, mes: MES, dia: 11 }));
    expect(vacio.body).toMatchObject({ total_dia: 0, items: [], ventas: [], metodos: [] });

    const mal = await comoAdmin(request(app).get("/api/recaudacion/dias").query({ anio: ANIO, mes: 0 }));
    expect(mal.status).toBe(400);
  });
});
