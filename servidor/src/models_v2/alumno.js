import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Extiende persona con datos específicos del rol alumno.
 * Relación 1:1 con persona (persona_id UNIQUE).
 *
 * IMPORTANTE: plan_tipo_id fue eliminado de esta tabla.
 * El plan activo se obtiene desde la membresía vigente (membresia.plan_tipo_id).
 * Almacenarlo aquí era redundante y podía desincronizarse.
 */
export const Alumno = sequelize.define("Alumno", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: "persona", key: "id" },
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "alumno_estado", key: "id" },
  },

  fecha_registro:         { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  certificado_apt_fisica: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

  creado_en:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // NULL = activo/inactivo según estado_id (el cron lo maneja)
  // Fecha = baja definitiva del gym (distinto a Inactivo, que puede volver)
  eliminado_en:  { type: DataTypes.DATE, allowNull: true },
}, {
  tableName:  "alumno",
  schema:     "gym_v3",
  timestamps: false,
  indexes: [
    { fields: ["persona_id"] },
    { fields: ["estado_id"] },
  ],
});
