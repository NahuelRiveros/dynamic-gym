import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Sexo = sequelize.define(
  "sexo",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion:   { type: DataTypes.TEXT, allowNull: false },
    actualizado_en:{ type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "sexo", timestamps: false }
);
