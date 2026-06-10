import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Ingreso = sequelize.define(
  "ingreso",
  {
    id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    membresia_id: { type: DataTypes.INTEGER, allowNull: false },
    fecha_ingreso:{ type: DataTypes.DATE, allowNull: false },
    hora_ingreso: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    creado_en:    { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: "ingreso", timestamps: false }
);
