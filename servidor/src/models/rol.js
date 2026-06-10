import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Rol = sequelize.define(
  "rol",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo:        { type: DataTypes.TEXT, allowNull: false, unique: true },
    descripcion:   { type: DataTypes.TEXT, allowNull: true },
    actualizado_en:{ type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW },
  },
  { tableName: "rol", timestamps: false }
);
