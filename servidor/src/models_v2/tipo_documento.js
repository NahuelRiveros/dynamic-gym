import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/** Catálogo de tipos de documento (DNI, Pasaporte, CUIL, etc.). */
export const TipoDocumento = sequelize.define("TipoDocumento", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "tipo_documento",
  schema:     "gym_v3",
  timestamps: false,
});
