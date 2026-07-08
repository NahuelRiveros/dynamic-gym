import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Historial auditable de movimientos de stock de un producto.
 * tipo: "entrada" (reposición), "venta" o "baja" (rotura, vencimiento, etc.).
 * Inmutable: no se actualiza ni elimina una vez registrado.
 */
export const MovimientoStock = sequelize.define("MovimientoStock", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "producto", key: "id" },
  },

  tipo:              { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [["entrada", "venta", "baja"]] } },
  motivo:            { type: DataTypes.STRING(150) },
  cantidad:          { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  precio_unitario:   { type: DataTypes.DECIMAL(10, 2) },
  metodo_pago:       { type: DataTypes.STRING(30) },

  registrado_por_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
  },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "movimiento_stock",
  schema:     "gym_v3",
  timestamps: false,
  indexes: [
    { fields: ["producto_id"] },
    { fields: ["tipo"] },
    { fields: ["creado_en"] },
  ],
});
