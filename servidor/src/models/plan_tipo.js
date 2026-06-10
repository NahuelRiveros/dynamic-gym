import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const PlanTipo = sequelize.define(
  "plan_tipo",
  {
    id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion:   { type: DataTypes.STRING, allowNull: false, unique: true },
    actualizado_en:{ type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    dias_totales:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ingresos:      { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    precio:        { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    activo:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "plan_tipo", timestamps: false }
);
