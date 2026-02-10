import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatTipoDocumento = sequelize.define("gym_cat_tipodocumento", {
      gym_cat_tipodocumento_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gym_cat_tipodocumento_descripcion: { type: DataTypes.TEXT, allowNull: false },
      gym_cat_tipodocumento_fechacambio: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "gym_cat_tipodocumento",
  timestamps: false
});

