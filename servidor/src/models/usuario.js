import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Usuario = sequelize.define(
  "usuario",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    persona_id:    { type: DataTypes.INTEGER, allowNull: true },
    contrasena:    { type: DataTypes.TEXT, allowNull: true },
    actualizado_en:{ type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
    activo:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ultimo_login:  { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "usuario", timestamps: false }
);
