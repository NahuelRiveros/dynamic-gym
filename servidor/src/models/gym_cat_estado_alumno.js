import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatEstadoAlumno = sequelize.define(
  "gym_cat_estado_alumno",
  {
    gym_cat_estadoalumno_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gym_cat_estadoalumno_descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    gym_cat_estadoalumno_fechacambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "gym_cat_estado_alumno",
    timestamps: false,
  }
);