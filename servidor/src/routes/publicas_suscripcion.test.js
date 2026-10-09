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

  it("avisa si el plan es ilimitado, así no se le dice 'sin ingresos' a quien no los descuenta", async () => {
    const comun = await request(app).get(`/api/consulta/plan/${ALUMNOS_TEST.conPlan.documento}`);
    expect(comun.body.plan_actual.ingresos_ilimitados).toBe(false);

    // Alumno propio con un plan de ingresos = 0 (ilimitado) y 0 ingresos disponibles.
    const [[plan]] = await sequelize.query(
      "INSERT INTO gym_v3.plan_tipo (descripcion, dias_totales, ingresos, precio, activo) VALUES ('Pase libre test', 30, 0, 0, TRUE) RETURNING id",
    );
    const [[persona]] = await sequelize.query(
      "INSERT INTO gym_v3.persona (tipo_documento_id, nombre, apellido, documento) VALUES (1, 'Libre', 'Ilimitado', '30454545') RETURNING id",
    );
    const [[alumno]] = await sequelize.query("INSERT INTO gym_v3.alumno (persona_id, estado_id) VALUES (:id, 1) RETURNING id", {
      replacements: { id: persona.id },
    });
    await sequelize.query(
      `INSERT INTO gym_v3.membresia (alumno_id, plan_tipo_id, fecha_inicio, fecha_fin, dias_totales, ingresos_disponibles)
       VALUES (:a, :p, CURRENT_DATE, CURRENT_DATE + 30, 30, 0)`,
      { replacements: { a: alumno.id, p: plan.id } },
    );

    const libre = await request(app).get("/api/consulta/plan/30454545");
    expect(libre.body.plan_actual).toMatchObject({ ingresos_ilimitados: true, ingresos_disponibles: 0, vigente_hoy: true });
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

  it("solo el super admin cambia el precio; el admin lo ve con las reglas del ciclo", async () => {
    const tokenSuper = await tokenDe(app, USUARIOS_TEST.superAdmin);
    const comoSuper = (pedido) => pedido.set("Authorization", `Bearer ${tokenSuper}`);
    const [{ n }] = await sequelize.query("SELECT count(*)::int AS n FROM public.software_suscripcion", { type: "SELECT" });
    if (n === 0) {
      await sequelize.query("INSERT INTO public.software_suscripcion (fecha_inicio, fecha_vencimiento, precio, cliente_nombre) VALUES (CURRENT_DATE, CURRENT_DATE + 20, 10000, 'Gym test')");
    }

    expect((await comoAdmin(request(app).post("/api/suscripcion/super/precio")).send({ precio: 1 })).status).toBe(403);
    const mal = await comoSuper(request(app).post("/api/suscripcion/super/precio")).send({ precio: 0 });
    expect(mal.status).toBe(400);
    expect(mal.body.mensaje).toBe("El precio tiene que ser mayor a 0");

    const ok = await comoSuper(request(app).post("/api/suscripcion/super/precio")).send({ precio: 60000 });
    expect(ok.body).toMatchObject({ ok: true, precio: 60000 });

    const estado = await comoAdmin(request(app).get("/api/suscripcion/estado"));
    expect(estado.body).toMatchObject({ precio: 60000, dias_aviso: 10, dias_gracia: 3 });
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
