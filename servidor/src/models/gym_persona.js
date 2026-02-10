import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymPersona = sequelize.define("gym_persona", {
  gym_persona_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  gym_persona_rela_tipodocumento: { type: DataTypes.INTEGER, allowNull: true },
  gym_persona_rela_sexo: { type: DataTypes.INTEGER, allowNull: true },
  gym_persona_rela_tipopersona: { type: DataTypes.INTEGER, allowNull: true },

  gym_persona_nombre: { type: DataTypes.STRING, allowNull: false },
  gym_persona_apellido: { type: DataTypes.STRING, allowNull: false },
  gym_persona_fechanacimiento: { type: DataTypes.DATEONLY, allowNull: true },
  gym_persona_documento: { type: DataTypes.BIGINT, allowNull: false },
  gym_persona_celular: { type: DataTypes.BIGINT, allowNull: true },
  gym_persona_celular_emergencia: { type: DataTypes.BIGINT, allowNull: true },
  gym_persona_email: { type: DataTypes.STRING, allowNull: true },

  gym_persona_fechacambio: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: "gym_persona",
  timestamps: false
});
