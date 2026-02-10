import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymDiaIngreso = sequelize.define(
  "gym_dia_ingreso",
  {
    gym_dia_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    gym_dia_rela_fecha: { type: DataTypes.INTEGER, allowNull: false }, // FK a gym_fecha_disponible.gym_fecha_id
    gym_dia_fechaingreso: { type: DataTypes.DATE, allowNull: false },
    gym_dia_fechacambio: { type: DataTypes.DATE, allowNull: false },
    gym_dia_horaingreso: { type: DataTypes.DATE, allowNull: false,defaultValue: DataTypes.NOW,},

  },
  {
    tableName: "gym_dia_ingreso",
    timestamps: false,
  }
);
