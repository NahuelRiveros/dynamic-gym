import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const AlumnoEstadoLog = sequelize.define(
  "alumno_estado_log",
  {
    id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    alumno_id:         { type: DataTypes.INTEGER, allowNull: false },
    estado_anterior_id:{ type: DataTypes.INTEGER, allowNull: true },
    estado_nuevo_id:   { type: DataTypes.INTEGER, allowNull: false },
    creado_en:         { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    motivo:            { type: DataTypes.TEXT, allowNull: true },
    fuente:            { type: DataTypes.STRING(50), allowNull: true },
    modificado_por:    { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "alumno_estado_log", timestamps: false }
);
