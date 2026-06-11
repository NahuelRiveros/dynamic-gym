import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Tabla de unión N:N entre usuario y rol.
 * UNIQUE(usuario_id, rol_id) previene duplicados a nivel DB.
 * ON DELETE CASCADE: si se elimina el usuario, se limpian sus roles.
 */
export const UsuarioRol = sequelize.define("UsuarioRol", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "usuario", key: "id" },
    onDelete: "CASCADE",
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "rol", key: "id" },
  },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "usuario_rol",
  timestamps: false,
  indexes: [
    { unique: true, fields: ["usuario_id", "rol_id"] },
    { fields: ["usuario_id"] },
  ],
});
