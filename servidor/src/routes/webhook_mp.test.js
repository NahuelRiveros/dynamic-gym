import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { verificarPago } from "../services/mercadopago_service.js";

// En los tests no hay MP: se simula la respuesta de su API para cada pago.
vi.mock("../services/mercadopago_service.js", () => ({
  crearPreferencia: vi.fn(),
  verificarPago: vi.fn(),
}));

const app = createApp();
const VENCIMIENTO_INICIAL = "2030-01-15";

const pagoDeMp = (id, status) => ({
  id,
  estado: status,
  monto: 10000,
  external_reference: "suscripcion-1",
  aprobado: status === "approved",
  detalle: { metodo: "visa" },
});
const avisar = (id) => request(app).post("/api/suscripcion/webhook").send({ type: "payment", data: { id } });

const vencimiento = async () => {
  const [s] = await sequelize.query(
    "SELECT fecha_vencimiento::text AS v FROM public.software_suscripcion ORDER BY id LIMIT 1",
    { type: "SELECT" },
  );
  return s.v;
};
const pagosRegistrados = (id) =>
  sequelize.query("SELECT estado FROM public.software_pago WHERE mp_payment_id = :id", {
    replacements: { id: String(id) },
    type: "SELECT",
  });

beforeAll(async () => {
  const [{ n }] = await sequelize.query("SELECT count(*)::int AS n FROM public.software_suscripcion", { type: "SELECT" });
  if (n === 0) {
    await sequelize.query(
      "INSERT INTO public.software_suscripcion (fecha_inicio, fecha_vencimiento, precio, cliente_nombre) VALUES (CURRENT_DATE, :v, 10000, 'Gym test')",
      { replacements: { v: VENCIMIENTO_INICIAL } },
    );
  }
});
beforeEach(async () => {
  await sequelize.query(
    "UPDATE public.software_suscripcion SET fecha_vencimiento = :v WHERE id = (SELECT id FROM public.software_suscripcion ORDER BY id LIMIT 1)",
    { replacements: { v: VENCIMIENTO_INICIAL } },
  );
});
afterAll(() => sequelize.close());

describe("Webhook de Mercado Pago", () => {
  it("un pago aprobado extiende la suscripción una sola vez, aunque MP mande el aviso repetido y al mismo tiempo", async () => {
    verificarPago.mockResolvedValue(pagoDeMp(9001, "approved"));

    const respuestas = await Promise.all([avisar(9001), avisar(9001), avisar(9001)]);
    const reenvio = await avisar(9001);

    expect([...respuestas, reenvio].map((r) => r.status)).toEqual([200, 200, 200, 200]);
    expect(await vencimiento()).toBe("2030-03-01");
    expect(await pagosRegistrados(9001)).toEqual([{ estado: "aprobado" }]);
  });

  it("un pago pendiente no extiende; cuando MP avisa que se aprobó, extiende y actualiza el mismo registro", async () => {
    verificarPago.mockResolvedValue(pagoDeMp(9002, "pending"));
    await avisar(9002);
    expect(await vencimiento()).toBe(VENCIMIENTO_INICIAL);
    expect(await pagosRegistrados(9002)).toEqual([{ estado: "pending" }]);

    verificarPago.mockResolvedValue(pagoDeMp(9002, "approved"));
    await avisar(9002);
    expect(await vencimiento()).toBe("2030-03-01");
    expect(await pagosRegistrados(9002)).toEqual([{ estado: "aprobado" }]);
  });

  it("si MP no responde, contesta 200 igual (para que no reintente sin fin) y no toca la suscripción", async () => {
    verificarPago.mockRejectedValue(new Error("MP caído"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const r = await avisar(9003);

    expect(r.status).toBe(200);
    expect(await vencimiento()).toBe(VENCIMIENTO_INICIAL);
    expect(await pagosRegistrados(9003)).toEqual([]);
  });
});
