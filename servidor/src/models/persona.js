import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Persona = sequelize.define(
  "persona",
  {
    id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_documento_id:  { type: DataTypes.INTEGER, allowNull: true },
    sexo_id:            { type: DataTypes.INTEGER, allowNull: true },
    tipo_persona_id:    { type: DataTypes.INTEGER, allowNull: true },
    nombre:             { type: DataTypes.STRING, allowNull: false },
    apellido:           { type: DataTypes.STRING, allowNull: false },
    fecha_nacimiento:   { type: DataTypes.DATEONLY, allowNull: true },
    documento:          { type: DataTypes.BIGINT, allowNull: false },
    celular:            { type: DataTypes.BIGINT, allowNull: true },
    celular_emergencia: { type: DataTypes.BIGINT, allowNull: true },
    email:              { type: DataTypes.STRING, allowNull: true },
    actualizado_en:     { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "persona", timestamps: false }
);
