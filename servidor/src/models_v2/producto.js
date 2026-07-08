import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Catálogo de productos de venta en el local (agua, bebidas, suplementos, etc.).
 * stock_actual se mantiene como contador, actualizado en la misma transacción
 * que cada movimiento_stock — ver stock_service.js.
 */
export const Producto = sequelize.define("Producto", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  nombre:       { type: DataTypes.STRING(120), allowNull: false },
  categoria_id: {
    type: DataTypes.INTEGER,
    references: { model: "categoria_producto", key: "id" },
  },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  stock_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  activo:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

  creado_en:      { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "producto",
  schema:     "gym_v3",
  timestamps: false,
  indexes: [
    { fields: ["activo"] },
  ],
});
