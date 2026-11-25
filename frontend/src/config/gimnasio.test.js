import { describe, expect, it } from "vitest";
import { estadoApertura } from "./gimnasio.js";

const estado = (fecha) => estadoApertura(new Date(fecha));

describe("Cartel de abierto / cerrado (hora argentina, UTC-3)", () => {
  it("abierto: dice hasta qué hora", () => {
    expect(estado("2026-10-12T10:00:00Z")).toEqual({ abierto: true, texto: "Abierto ahora, hasta las 23 h" }); // lunes 7:00
    expect(estado("2026-10-17T17:59:00Z")).toEqual({ abierto: true, texto: "Abierto ahora, hasta las 15 h" }); // sábado 14:59
  });

  it("cerrado: dice cuándo abre", () => {
    expect(estado("2026-10-12T09:59:00Z")).toEqual({ abierto: false, texto: "Cerrado, abre hoy a las 7 h" }); // lunes 6:59
    expect(estado("2026-10-13T02:00:00Z").texto).toBe("Cerrado, abre mañana a las 7 h"); // lunes 23:00
    expect(estado("2026-10-17T02:30:00Z").texto).toBe("Cerrado, abre mañana a las 9 h"); // viernes 23:30
  });

  it("el domingo está cerrado: desde el sábado a la tarde avisa que abre el lunes", () => {
    expect(estado("2026-10-17T18:00:00Z").texto).toBe("Cerrado, abre el lunes a las 7 h"); // sábado 15:00
    expect(estado("2026-10-18T15:00:00Z")).toEqual({ abierto: false, texto: "Cerrado, abre mañana a las 7 h" }); // domingo 12:00
  });
});
