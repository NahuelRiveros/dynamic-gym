import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymUsuario = sequelize.define(
  "GymUsuario",
  {
    gym_usuario_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gym_usuario_rela_persona: {
      type: DataTypes.INTEGER,
      allowNull: true, // tu DB lo permite, aunque en la lógica debería ser NOT NULL
    },
    gym_usuario_contrasena: {
      type: DataTypes.TEXT,
      allowNull: true, // tu DB lo permite, pero tu lógica exigirá bcrypt hash
    },
    gym_usuario_fechacambio: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    gym_usuario_activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    gym_usuario_ultimo_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "gym_usuario",
    timestamps: false,
  }
);
