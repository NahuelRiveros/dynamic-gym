import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const UsuarioRol = sequelize.define(
  "usuario_rol",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id:    { type: DataTypes.INTEGER, allowNull: false },
    rol_id:        { type: DataTypes.INTEGER, allowNull: false },
    actualizado_en:{ type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  },
  { tableName: "usuario_rol", timestamps: false }
);
