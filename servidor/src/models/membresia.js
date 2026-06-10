import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const Membresia = sequelize.define(
  "membresia",
  {
    id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    alumno_id:           { type: DataTypes.INTEGER, allowNull: false },
    monto_pagado:        { type: DataTypes.REAL, allowNull: true },
    fecha_inicio:        { type: DataTypes.DATEONLY, allowNull: false },
    fecha_fin:           { type: DataTypes.DATEONLY, allowNull: false },
    dias_totales:        { type: DataTypes.INTEGER, allowNull: true },
    ingresos_disponibles:{ type: DataTypes.INTEGER, allowNull: true },
    metodo_pago:         { type: DataTypes.TEXT, allowNull: true },
    actualizado_en:      { type: DataTypes.DATE, allowNull: true },
    plan_tipo_id:        { type: DataTypes.INTEGER, allowNull: false },
    cobrado_por_id:      { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "membresia", timestamps: false }
);
