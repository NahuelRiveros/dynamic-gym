import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "../configuracion_servidor/env.js";
import { invalidarCacheSuscripcion, verificarSuscripcion } from "./suscripcion_middleware.js";
import { obtenerEstado } from "../services/software_suscripcion_service.js";

vi.mock("../services/software_suscripcion_service.js", () => ({ obtenerEstado: vi.fn() }));

function pasarPor({ method = "POST", path = "/pagos", token } = {}) {
  const req = { method, path, headers: token ? { authorization: `Bearer ${token}` } : {} };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  return verificarSuscripcion(req, res, next).then(() => ({ res, next }));
}

beforeEach(() => {
  invalidarCacheSuscripcion();
  vi.mocked(obtenerEstado).mockReset();
});

describe("Suscripción del software", () => {
  it("con la suscripción vencida bloquea las altas con 402, pero no las consultas ni el kiosco", async () => {
    vi.mocked(obtenerEstado).mockResolvedValue({ bloqueado: true });

    const alta = await pasarPor();
    expect(alta.next).not.toHaveBeenCalled();
    expect(alta.res.status).toHaveBeenCalledWith(402);
    expect(alta.res.json).toHaveBeenCalledWith(expect.objectContaining({ codigo: "SUSCRIPCION_VENCIDA" }));

    expect((await pasarPor({ method: "GET" })).next).toHaveBeenCalled();
    expect((await pasarPor({ path: "/ingresos/dni" })).next).toHaveBeenCalled();
    // Sin poder iniciar sesión, nadie podría entrar a renovarla.
    expect((await pasarPor({ path: "/auth/login" })).next).toHaveBeenCalled();
    // "/ingresosx" no es "/ingresos": solo pasa la ruta exacta o lo que cuelga de ella.
    expect((await pasarPor({ path: "/ingresosx" })).next).not.toHaveBeenCalled();
  });

  it("con sesión iniciada deja operar aunque esté vencida", async () => {
    vi.mocked(obtenerEstado).mockResolvedValue({ bloqueado: true });
    const token = jwt.sign({ sub: 1, roles: ["admin"] }, env.JWT_SECRET);

    expect((await pasarPor({ token })).next).toHaveBeenCalled();
  });

  it("guarda el estado 5 minutos para no consultar la base en cada pedido", async () => {
    vi.mocked(obtenerEstado).mockResolvedValue({ bloqueado: false });

    await pasarPor();
    await pasarPor();
    expect(obtenerEstado).toHaveBeenCalledTimes(1);
  });

  it("si la consulta falla deja pasar (no bloquea al gimnasio por un error técnico)", async () => {
    vi.mocked(obtenerEstado).mockRejectedValue(new Error("base caída"));

    expect((await pasarPor()).next).toHaveBeenCalled();
  });
});
