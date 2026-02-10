import { GymCatTipoDocumento, GymCatSexo, GymCatTipoPersona } from "../models/index.js";

export async function obtenerCatalogos() {
  const [tiposDocumento, sexos, tiposPersona] = await Promise.all([
    GymCatTipoDocumento.findAll({
      attributes: ["gym_cat_tipodocumento_id", "gym_cat_tipodocumento_descripcion"],
      order: [["gym_cat_tipodocumento_descripcion", "ASC"]],
    }),
    GymCatSexo.findAll({
      attributes: ["gym_cat_sexo_id", "gym_cat_sexo_descripcion"],
      order: [["gym_cat_sexo_descripcion", "ASC"]],
    }),
    GymCatTipoPersona.findAll({
      attributes: ["gym_cat_tipopersona_id", "gym_cat_tipopersona_descripcion"],
      order: [["gym_cat_tipopersona_descripcion", "ASC"]],
    }),
  ]);

  return {
    tiposDocumento: tiposDocumento.map((x) => ({
      value: x.gym_cat_tipodocumento_id,
      label: x.gym_cat_tipodocumento_descripcion,
    })),
    sexos: sexos.map((x) => ({
      value: x.gym_cat_sexo_id,
      label: x.gym_cat_sexo_descripcion,
    })),
    tiposPersona: tiposPersona.map((x) => ({
      value: x.gym_cat_tipopersona_id,
      label: x.gym_cat_tipopersona_descripcion,
    })),
  };
}
