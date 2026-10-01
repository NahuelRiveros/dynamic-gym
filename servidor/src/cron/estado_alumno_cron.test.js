import cron from "node-cron";
import { describe, expect, it, vi } from "vitest";
import { iniciarCronEstadoAlumnos } from "./estado_alumno_cron.js";

vi.mock("node-cron", () => ({ default: { schedule: vi.fn() } }));
vi.mock("../services/estado_alumno_auto_service.js", () => ({ actualizarEstadosAlumnosAutomatico: vi.fn() }));

describe("Cron de estados de alumnos", () => {
  it("corre una vez por hora, en punto (no cada pocos minutos: despertaría a Neon)", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    iniciarCronEstadoAlumnos();

    expect(cron.schedule).toHaveBeenCalledWith("0 * * * *", expect.any(Function));
  });
});
