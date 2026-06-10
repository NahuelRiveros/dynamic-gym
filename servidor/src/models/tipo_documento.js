import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const TipoDocumento = sequelize.define(
  "tipo_documento",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion:   { type: DataTypes.TEXT, allowNull: false },
    actualizado_en:{ type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "tipo_documento", timestamps: false }
);
