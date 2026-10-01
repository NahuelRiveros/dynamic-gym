import { afterAll, describe, expect, it } from "vitest";
import { QueryTypes } from "sequelize";
import { sequelize } from "./sequelize.js";

afterAll(() => sequelize.close());

describe("Conexiones del pool", () => {
  it("todas usan la hora argentina, no solo la primera (si no, desde las 21 h CURRENT_DATE es 'mañana')", async () => {
    // Varias consultas a la vez obligan al pool a abrir más de una conexión.
    const zonas = await Promise.all(
      Array.from({ length: 4 }, () =>
        sequelize.query("SELECT current_setting('TimeZone') AS zona, pg_sleep(0.05)", { type: QueryTypes.SELECT }),
      ),
    );

    expect(zonas.map(([fila]) => fila.zona)).toEqual(Array(4).fill("America/Argentina/Cordoba"));
  });
});
