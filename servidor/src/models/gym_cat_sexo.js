import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatSexo = sequelize.define("gym_cat_sexo", {
      gym_cat_sexo_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      gym_cat_sexo_descripcion: { type: DataTypes.TEXT, allowNull: false },
      gym_cat_sexo_fechacambio: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: "gym_cat_sexo",
  timestamps: false
});

