import { describe, expect, it } from "vitest";
import { verificarBaseDeTest } from "./base_test.js";

describe("Candado de la base de test", () => {
  it("acepta una base local terminada en _auto_test", () => {
    expect(() => verificarBaseDeTest({ host: "localhost", nombre: "dynamicgym_auto_test" })).not.toThrow();
  });

  it("rechaza Neon, una URL de conexión y las bases con datos", () => {
    expect(() => verificarBaseDeTest({ host: "ep-algo.neon.tech", nombre: "dynamicgym_auto_test" })).toThrow(/local/);
    expect(() => verificarBaseDeTest({ host: "localhost", nombre: "dynamicgym_auto_test", url: "postgres://x" })).toThrow(/DATABASE_URL/);
    expect(() => verificarBaseDeTest({ host: "localhost", nombre: "dynamicgym" })).toThrow(/_auto_test/);
    expect(() => verificarBaseDeTest({ host: "localhost", nombre: "dynamicgym_test" })).toThrow(/_auto_test/);
  });
});
