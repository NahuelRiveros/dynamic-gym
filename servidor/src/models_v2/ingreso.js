import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Log de asistencia al gimnasio.
 * Cada fila = un acceso físico al gym dentro de una membresía vigente.
 * Inmutable: no se actualiza ni elimina una vez registrado.
 */
export const Ingreso = sequelize.define("Ingreso", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  membresia_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "membresia", key: "id" },
  },

  fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  hora_ingreso:  { type: DataTypes.TIME, allowNull: false, defaultValue: DataTypes.NOW },
  creado_en:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "ingreso",
  timestamps: false,
  indexes: [
    { fields: ["membresia_id"] },
    { fields: ["fecha_ingreso"] },
  ],
});
