import { describe, expect, it } from "vitest";
import { avanceFijo, poner, tramo } from "./escenas.js";

const escenaDe = (alto) => {
  const fija = document.createElement("div");
  Object.defineProperty(fija, "offsetHeight", { value: alto });
  return fija;
};

describe("Cuentas de las escenas de scroll", () => {
  it("tramo va de 0 a 1 y no se pasa", () => {
    expect(tramo(-5, 0, 10)).toBe(0);
    expect(tramo(5, 0, 10)).toBe(0.5);
    expect(tramo(50, 0, 10)).toBe(1);
  });

  it("avanceFijo mide cuánto se recorrió de la sección", () => {
    const seccion = { offsetHeight: 3000, getBoundingClientRect: () => ({ top: -1000 }) };
    expect(avanceFijo(seccion, escenaDe(1000))).toBe(0.5);
  });

  it("sin recorrido (sección tan alta como la escena) devuelve 0 en vez de dividir por cero", () => {
    const seccion = { offsetHeight: 800, getBoundingClientRect: () => ({ top: -100 }) };
    expect(avanceFijo(seccion, escenaDe(800))).toBe(0);
  });

  it("poner escribe la variable CSS con 4 decimales", () => {
    const el = document.createElement("div");
    poner(el, "--f", 1 / 3);
    expect(el.style.getPropertyValue("--f")).toBe("0.3333");
  });
});
