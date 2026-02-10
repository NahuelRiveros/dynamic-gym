import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymFechaDisponible = sequelize.define(
  "gym_fecha_disponible",
  {
    gym_fecha_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    gym_fecha_rela_alumno: { type: DataTypes.INTEGER, allowNull: false },
    gym_fecha_montopagado: { type: DataTypes.REAL, allowNull: true },
    gym_fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
    gym_fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
    gym_fecha_diasingreso: { type: DataTypes.INTEGER, allowNull: true },
    gym_fecha_ingresosdisponibles: { type: DataTypes.INTEGER, allowNull: true },
    gym_fecha_metodopago: { type: DataTypes.TEXT, allowNull: true },
    gym_fecha_fechacambio: { type: DataTypes.DATE, allowNull: true },
    gym_fecha_rela_tipoplan: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: "gym_fecha_disponible",
    timestamps: false,
  }
);
