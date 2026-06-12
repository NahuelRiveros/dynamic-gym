import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Roles del sistema.
 * codigo es el identificador de negocio que se embebe en el JWT: 'admin' | 'staff'.
 */
export const Rol = sequelize.define("Rol", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(150), allowNull: false },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "rol",
  schema:     "gym_v3",
  timestamps: false,
});
