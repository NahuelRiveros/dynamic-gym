import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Alumno = sequelize.define(
  "alumno",
  {
    id:                    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    persona_id:            { type: DataTypes.INTEGER, allowNull: false },
    plan_tipo_id:          { type: DataTypes.INTEGER, allowNull: true },
    estado_id:             { type: DataTypes.INTEGER, allowNull: false },
    fecha_registro:        { type: DataTypes.DATEONLY, allowNull: true },
    certificado_apt_fisica:{ type: DataTypes.STRING, allowNull: true },
    actualizado_en:        { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "alumno", timestamps: false }
);
