import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymRol = sequelize.define(
  "GymRol",
  {
    gym_rol_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gym_rol_codigo: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    gym_rol_descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gym_rol_fechacambio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "gym_rol",
    timestamps: false,
  }
);
