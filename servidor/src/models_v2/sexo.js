import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/** Catálogo de géneros (Masculino, Femenino, Otro). */
export const Sexo = sequelize.define("Sexo", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "sexo",
  schema:     "gym_v3",
  timestamps: false,
});
