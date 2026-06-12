import {
  TipoDocumento,
  Sexo,
  TipoPersona,
  PlanTipo,
} from "../models_v2/index.js";

export async function obtenerCatalogos() {
  const [tiposDocumento, sexos, tiposPersona, tiposPlan] = await Promise.all([
    TipoDocumento.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    Sexo.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    TipoPersona.findAll({
      attributes: ["id", "descripcion"],
      order: [["descripcion", "ASC"]],
    }),
    PlanTipo.findAll({
      attributes: ["id", "descripcion", "dias_totales", "ingresos", "precio"],
      where: { activo: true },
      order: [["descripcion", "ASC"]],
    }),
  ]);

  return {
    tiposDocumento: tiposDocumento.map((x) => ({ value: x.id, label: x.descripcion })),
    sexos:          sexos.map((x) => ({ value: x.id, label: x.descripcion })),
    tiposPersona:   tiposPersona.map((x) => ({ value: x.id, label: x.descripcion })),
    tiposPlan:      tiposPlan.map((x) => ({
      value:       x.id,
      label:       x.descripcion,
      dias_totales: x.dias_totales,
      ingresos:    x.ingresos,
      precio:      Number(x.precio),
    })),
  };
}
