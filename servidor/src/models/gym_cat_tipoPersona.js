import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatTipoPersona = sequelize.define("gym_cat_tipopersona", {
      gym_cat_tipopersona_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gym_cat_tipopersona_descripcion: { type: DataTypes.TEXT, allowNull: false },
      gym_cat_tipopersona_fechacambio: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "gym_cat_tipopersona",
  timestamps: false
});

