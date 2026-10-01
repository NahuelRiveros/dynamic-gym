import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let tokenAdmin;
let tokenStaff;
let productoId;
const con = (token) => (pedido) => pedido.set("Authorization", `Bearer ${token}`);

beforeAll(async () => {
  tokenAdmin = await tokenDe(app, USUARIOS_TEST.admin);
  tokenStaff = await tokenDe(app, USUARIOS_TEST.staff);
  const r = await con(tokenAdmin)(request(app).post("/api/stock")).send({ nombre: "Agua 500 ml", categoria_id: 1, precio_venta: 800, stock_minimo: 5 });
  productoId = r.body.data.id;
});
afterAll(() => sequelize.close());

describe("Stock y ventas", () => {
  it("el staff repone y vende; el stock baja y la venta guarda el precio del producto", async () => {
    const entrada = await con(tokenStaff)(request(app).post(`/api/stock/${productoId}/entrada`)).send({ cantidad: 10 });
    expect(entrada.body.data.stock_actual).toBe(10);

    const venta = await con(tokenStaff)(request(app).post(`/api/stock/${productoId}/venta`)).send({ cantidad: 3, metodo_pago: "efectivo" });
    expect(venta.status).toBe(200);
    expect(venta.body.data.stock_actual).toBe(7);

    const historial = await con(tokenAdmin)(request(app).get(`/api/stock/${productoId}/movimientos`));
    expect(historial.body.data[0]).toMatchObject({ tipo: "venta", cantidad: 3, usuario: `${USUARIOS_TEST.staff.nombre} ${USUARIOS_TEST.staff.apellido}` });
    expect(Number(historial.body.data[0].precio_unitario)).toBe(800);
  });

  it("no vende más de lo que hay ni sin método de pago", async () => {
    const deMas = await con(tokenStaff)(request(app).post(`/api/stock/${productoId}/venta`)).send({ cantidad: 999, metodo_pago: "efectivo" });
    expect(deMas.status).toBe(409);
    expect(deMas.body.codigo).toBe("STOCK_INSUFICIENTE");

    const sinMetodo = await con(tokenStaff)(request(app).post(`/api/stock/${productoId}/venta`)).send({ cantidad: 1 });
    expect(sinMetodo.status).toBe(400);
  });

  it("la baja es solo para admin y pide motivo", async () => {
    expect((await con(tokenStaff)(request(app).post(`/api/stock/${productoId}/baja`)).send({ cantidad: 1, motivo: "Vencido" })).status).toBe(403);
    expect((await con(tokenAdmin)(request(app).post(`/api/stock/${productoId}/baja`)).send({ cantidad: 1 })).status).toBe(400);
    expect((await con(tokenAdmin)(request(app).post(`/api/stock/${productoId}/baja`)).send({ cantidad: 1, motivo: "Vencido" })).status).toBe(200);
  });

  it("un id que no es número responde 400; uno que no existe, 404", async () => {
    expect((await con(tokenStaff)(request(app).get("/api/stock/abc"))).status).toBe(400);
    expect((await con(tokenStaff)(request(app).post("/api/stock/999/entrada")).send({ cantidad: 1 })).status).toBe(404);
  });

  it("las estadísticas del año cuentan las ventas y mermas de este año", async () => {
    const anio = new Date().getFullYear();

    const mensual = await con(tokenAdmin)(request(app).get("/api/stock/estadisticas/mensual").query({ anio }));
    expect(mensual.body.items.reduce((s, m) => s + m.total_unidades, 0)).toBe(3);

    const mermas = await con(tokenAdmin)(request(app).get("/api/stock/estadisticas/mermas"));
    expect(mermas.body).toMatchObject({ anio, items: [{ motivo: "Vencido", total_unidades: 1 }] });

    const otroAnio = await con(tokenAdmin)(request(app).get("/api/stock/estadisticas/productos-mas-vendidos").query({ anio: anio - 1 }));
    expect(otroAnio.body.items).toEqual([]);
  });
});
