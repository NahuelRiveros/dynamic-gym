import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymAlumno = sequelize.define("gym_alumno", {
  gym_alumno_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  gym_alumno_rela_persona: { type: DataTypes.INTEGER, allowNull: false },
  gym_alumno_rela_tipoplan: { type: DataTypes.INTEGER, allowNull: true },
  gym_alumno_rela_estadoalumno: { type: DataTypes.INTEGER, allowNull: false },

  gym_alumno_fecharegistro: { type: DataTypes.DATEONLY, allowNull: true },
  gym_alumno_certificadoaptfisica: { type: DataTypes.STRING, allowNull: true },
  gym_alumno_fechacambio: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: "gym_alumno",
  timestamps: false
});
