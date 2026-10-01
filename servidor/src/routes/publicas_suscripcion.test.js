import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";
import { ALUMNOS_TEST, USUARIOS_TEST } from "../../tests/armar_base.js";
import { tokenDe } from "../../tests/sesiones.js";

const app = createApp();
let tokenAdmin;
const comoAdmin = (pedido) => pedido.set("Authorization", `Bearer ${tokenAdmin}`);

beforeAll(async () => {
  tokenAdmin = await tokenDe(app, USUARIOS_TEST.admin);
});
afterAll(() => sequelize.close());

describe("Consulta pública de plan (Mi Plan)", () => {
  it("muestra el plan con el DNI, sin sesión; DNI desconocido o mal escrito responden claro", async () => {
    const r = await request(app).get(`/api/consulta/plan/${ALUMNOS_TEST.conPlan.documento}`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, alumno: { nombre: ALUMNOS_TEST.conPlan.nombre }, plan_actual: { vigente_hoy: true } });

    expect((await request(app).get("/api/consulta/plan/11222333")).status).toBe(404);
    expect((await request(app).get("/api/consulta/plan/abc")).body.codigo).toBe("VALIDACION");
  });

  it("limita las consultas seguidas de una misma persona, sin frenar a las demás (detrás del proxy de Render)", async () => {
    const desde = (ip) => (pedido) => pedido.set("X-Forwarded-For", ip);

    let ultima;
    for (let i = 0; i < 31; i++) ultima = await desde("203.0.113.7")(request(app).get(`/api/consulta/plan/2000000${i}`));
    expect(ultima.status).toBe(429);
    expect(ultima.body.codigo).toBe("DEMASIADOS_INTENTOS");

    // Otra persona (otra IP real) sigue pudiendo consultar su plan.
    const otra = await desde("198.51.100.20")(request(app).get(`/api/consulta/plan/${ALUMNOS_TEST.conPlan.documento}`));
    expect(otra.status).toBe(200);
  });
});

describe("Promociones", () => {
  it("cuenta destinatarios con el filtro elegido y rechaza filtros inventados", async () => {
    const r = await comoAdmin(request(app).get("/api/promociones/preview").query({ filtro: "activos" }));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, total: expect.any(Number) });

    const inventado = await comoAdmin(request(app).get("/api/promociones/numeros").query({ filtro: "todos; DROP TABLE x" }));
    expect(inventado.status).toBe(400);
    expect(inventado.body.mensaje).toBe("Filtro inválido");
  });

  it("sin SMTP configurado avisa con un 400 claro (no 'Error interno')", async () => {
    // Un destinatario con email para que intente enviar.
    await sequelize.query("UPDATE gym_v3.persona SET email = 'carla@test.local' WHERE documento = :dni", {
      replacements: { dni: ALUMNOS_TEST.conPlan.documento },
    });

    const r = await comoAdmin(request(app).post("/api/promociones/enviar")).send({ subject: "Hola {nombre}", html: "<p>Promo</p>" });
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe("SMTP_NO_CONFIGURADO");
  });
});

describe("Suscripción del software", () => {
  it("las rutas de mantenimiento piden el SEED_SECRET (en los tests no hay: quedan deshabilitadas)", async () => {
    const r = await request(app).post("/api/suscripcion/admin/extender").send({ dias: 30 });

    expect(r.status).toBe(403);
    expect(r.body.codigo).toBe("SEED_DESHABILITADO");
  });

  it("el admin no puede extender su propia suscripción: eso es del super admin", async () => {
    const r = await comoAdmin(request(app).post("/api/suscripcion/super/extender")).send({ dias: 30 });

    expect(r.status).toBe(403);
  });

  it("sin Mercado Pago configurado, crear el pago avisa con un 400 claro", async () => {
    await sequelize.query(
      "INSERT INTO public.software_suscripcion (fecha_inicio, fecha_vencimiento, precio, cliente_nombre) VALUES (CURRENT_DATE, CURRENT_DATE + 10, 10000, 'Gym test')",
    );

    const r = await comoAdmin(request(app).post("/api/suscripcion/crear-pago"));
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe("MP_NO_CONFIGURADO");
  });
});
