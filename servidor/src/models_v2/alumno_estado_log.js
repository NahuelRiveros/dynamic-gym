import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

/**
 * Historial de cambios de estado de alumnos.
 * Tabla de auditoría — inmutable una vez insertada.
 * fuente: 'cron' | 'pago' | 'manual'
 * modificado_por: NULL si el cambio fue automático (cron).
 */
export const AlumnoEstadoLog = sequelize.define("AlumnoEstadoLog", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  alumno_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "alumno", key: "id" },
  },
  estado_anterior_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "alumno_estado", key: "id" },
  },
  estado_nuevo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "alumno_estado", key: "id" },
  },

  motivo:        { type: DataTypes.STRING(255), allowNull: true },
  fuente:        { type: DataTypes.STRING(50), allowNull: true },
  modificado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: "usuario", key: "id" },
  },

  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName:  "alumno_estado_log",
  timestamps: false,
  indexes: [
    { fields: ["alumno_id"] },
  ],
});
