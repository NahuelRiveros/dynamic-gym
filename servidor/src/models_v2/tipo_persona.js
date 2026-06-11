import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/** Catálogo de categorías de persona (Alumno, Profesor, Administrativo). */
export const TipoPersona = sequelize.define("TipoPersona", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "tipo_persona",
  timestamps: false,
});
