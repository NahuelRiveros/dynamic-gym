import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { estaAbierto } from "../config/gimnasio.js";
import { API, servidorMock } from "../test/servidor_mock.js";
import { useServidorDespierto } from "./use_servidor_despierto.js";

afterEach(() => vi.useRealTimers());

describe("Horario del gimnasio (hora argentina)", () => {
  it("abre lunes a viernes de 7 a 23 y sábados de 9 a 15", () => {
    expect(estaAbierto(new Date("2026-10-12T10:00:00Z"))).toBe(true); // lunes 7:00 AR
    expect(estaAbierto(new Date("2026-10-12T09:59:00Z"))).toBe(false); // lunes 6:59
    expect(estaAbierto(new Date("2026-10-13T01:59:00Z"))).toBe(true); // lunes 22:59
    expect(estaAbierto(new Date("2026-10-13T02:00:00Z"))).toBe(false); // lunes 23:00
    expect(estaAbierto(new Date("2026-10-17T17:00:00Z"))).toBe(true); // sábado 14:00
    expect(estaAbierto(new Date("2026-10-17T18:00:00Z"))).toBe(false); // sábado 15:00
    expect(estaAbierto(new Date("2026-10-18T15:00:00Z"))).toBe(false); // domingo 12:00
  });
});

describe("useServidorDespierto", () => {
  function contarPedidos() {
    const pedidos = { n: 0 };
    servidorMock.use(
      http.get(`${API}/health`, () => {
        pedidos.n += 1;
        return HttpResponse.json({ ok: true });
      }),
    );
    return pedidos;
  }

  it("con el gimnasio abierto avisa al servidor al entrar y cada 10 minutos", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date("2026-10-12T15:00:00Z")); // lunes 12:00 AR
    const pedidos = contarPedidos();
    renderHook(() => useServidorDespierto());

    await vi.waitFor(() => expect(pedidos.n).toBe(1));
    await act(() => vi.advanceTimersByTimeAsync(10 * 60 * 1000));
    await vi.waitFor(() => expect(pedidos.n).toBe(2));
  });

  it("con el gimnasio cerrado no hace ningún pedido", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date("2026-10-18T15:00:00Z")); // domingo
    const pedidos = contarPedidos();
    renderHook(() => useServidorDespierto());

    await act(() => vi.advanceTimersByTimeAsync(30 * 60 * 1000));
    expect(pedidos.n).toBe(0);
  });
});
