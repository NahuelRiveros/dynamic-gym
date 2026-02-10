import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymUsuarioRol = sequelize.define(
  "GymUsuarioRol",
  {
    gym_usuario_rol_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gym_usuario_rol_rela_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gym_usuario_rol_rela_rol: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gym_usuario_rol_fechacambio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "gym_usuario_rol",
    timestamps: false,
  }
);
