import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Secciones funcionales del sistema (alumnos, pagos, estadisticas, etc.).
 * Agrupa permisos y sirve para renderizar el panel de gestión de roles en la UI.
 * El campo `orden` define el orden de aparición en ese panel.
 */
export const Modulo = sequelize.define("Modulo", {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo:      { type: DataTypes.STRING(50), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(150), allowNull: false },
  // Orden de aparición en el panel de gestión de roles
  orden:       { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
  creado_en:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "modulo",
  timestamps: false,
  indexes: [
    { fields: ["orden"] },
  ],
});
