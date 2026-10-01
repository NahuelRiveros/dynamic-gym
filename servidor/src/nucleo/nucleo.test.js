import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { Conflicto } from "./errores.js";
import { manejadorErrores } from "./manejador_errores.js";
import { validar } from "./validar.js";
import { dni, idPositivo, z } from "./zod.js";

function appCon(...handlers) {
  const app = express();
  app.use(express.json());
  app.post("/prueba", ...handlers);
  app.use(manejadorErrores);
  return app;
}

describe("validar()", () => {
  const app = appCon(
    validar({ body: z.object({ documento: dni(), plan_id: idPositivo() }) }),
    (req, res) => res.json({ ok: true, datos: req.datos.body }),
  );

  it("deja los datos limpios en req.datos (DNI sin puntos, números convertidos)", async () => {
    const r = await request(app).post("/prueba").send({ documento: "30.111.222", plan_id: "3" });

    expect(r.body.datos).toEqual({ documento: "30111222", plan_id: 3 });
  });

  it("responde 400 VALIDACION con el problema en español y todos en detalles", async () => {
    const r = await request(app).post("/prueba").send({ documento: "12ab", plan_id: 0 });

    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ ok: false, codigo: "VALIDACION", mensaje: "El documento es obligatorio y debe tener solo números" });
    expect(r.body.detalles.map((d) => d.campo)).toEqual(["documento", "plan_id"]);
  });
});

describe("Manejador de errores", () => {
  it("responde los errores propios con su status y código", async () => {
    const app = appCon(() => {
      throw new Conflicto({ codigo: "YA_EXISTE", mensaje: "Ya existe" });
    });

    const r = await request(app).post("/prueba");
    expect(r.status).toBe(409);
    expect(r.body).toEqual({ ok: false, codigo: "YA_EXISTE", mensaje: "Ya existe" });
  });

  it("un error inesperado (también de una función async) responde 500 sin mostrar el detalle", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const app = appCon(async () => {
      throw new Error("relation \"gym_v3.secreto\" does not exist");
    });

    const r = await request(app).post("/prueba");
    expect(r.status).toBe(500);
    expect(r.body).toEqual({ ok: false, codigo: "ERROR", mensaje: "Error interno del servidor" });
  });

  it("un JSON mal escrito responde 400 JSON_INVALIDO", async () => {
    const app = appCon((_req, res) => res.json({ ok: true }));

    const r = await request(app).post("/prueba").set("Content-Type", "application/json").send("{mal");
    expect(r.status).toBe(400);
    expect(r.body.codigo).toBe("JSON_INVALIDO");
  });
});
