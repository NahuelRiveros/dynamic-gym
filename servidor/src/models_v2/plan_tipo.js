import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Planes de entrenamiento disponibles para la venta.
 * dias_totales y ingresos determinan la vigencia y límite de accesos.
 * Un plan inactivo no aparece en el formulario de registro de pago.
 */
export const PlanTipo = sequelize.define("PlanTipo", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  descripcion:  { type: DataTypes.STRING(100), allowNull: false, unique: true },
  // Duración del plan desde la fecha de inicio
  dias_totales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  // 0 = ingresos ilimitados
  ingresos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0 },
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "plan_tipo",
  schema:     "gym_v3",
  timestamps: false,
});
