import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const AlumnoEstado = sequelize.define(
  "alumno_estado",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion:   { type: DataTypes.STRING, allowNull: false, unique: true },
    actualizado_en:{ type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
  },
  { tableName: "alumno_estado", timestamps: false }
);
