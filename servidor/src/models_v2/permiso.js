import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Permiso atómico del sistema.
 * codigo = 'modulo:accion', ej: 'alumnos:editar', 'pagos:registrar'.
 *
 * El middleware requirePermiso('alumnos:editar') resuelve así:
 *   1. Obtiene roles del JWT del usuario
 *   2. Busca en rol_permiso si algún rol tiene ese permiso
 *   3. Pasa o devuelve 403
 *
 * Nunca eliminar un permiso si está asignado — usar ON DELETE CASCADE en rol_permiso.
 */
export const Permiso = sequelize.define("Permiso", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  modulo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "modulo", key: "id" },
  },

  // Formato: 'modulo:accion' — es el string que evalúa requirePermiso()
  codigo:      { type: DataTypes.STRING(100), allowNull: false, unique: true },
  // Acción dentro del módulo: leer | crear | editar | registrar | gestionar | enviar
  accion:      { type: DataTypes.STRING(50), allowNull: false },
  descripcion: { type: DataTypes.STRING(200), allowNull: false },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "permiso",
  timestamps: false,
  indexes: [
    { fields: ["modulo_id"] },
    { fields: ["codigo"] },
  ],
});
