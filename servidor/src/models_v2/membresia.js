import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Registro de pago y período de vigencia de un alumno.
 * Cada fila = un pago. Un alumno puede tener múltiples membresías a lo largo del tiempo.
 *
 * La vigencia actual se determina comparando fecha_fin con la fecha de hoy.
 * ingresos_disponibles se decrementa con cada ingreso registrado.
 * cobrado_por_id es obligatorio para auditoría de caja.
 */
export const Membresia = sequelize.define("Membresia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  alumno_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "alumno", key: "id" },
  },
  plan_tipo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "plan_tipo", key: "id" },
  },
  // Quién registró el cobro — obligatorio para auditoría de caja
  cobrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  monto_pagado: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  metodo_pago:          { type: DataTypes.STRING(30), allowNull: false, defaultValue: "efectivo" },
  fecha_inicio:         { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin:            { type: DataTypes.DATEONLY, allowNull: false },
  dias_totales:         { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  ingresos_disponibles: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },

  creado_en:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "membresia",
  schema:     "gym_v3",
  timestamps: false,
  indexes: [
    { fields: ["alumno_id"] },
    { fields: ["plan_tipo_id"] },
    { fields: ["fecha_fin"] },
    { fields: ["fecha_inicio"] },
  ],
});
