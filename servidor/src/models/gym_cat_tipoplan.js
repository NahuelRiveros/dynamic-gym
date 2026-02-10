import { DataTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

export const GymCatTipoPlan = sequelize.define("gym_cat_tipoplan",
    {
        gym_cat_tipoplan_id:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        gym_cat_tipoplan_descripcion:{type: DataTypes.STRING , allowNull: false},
        gym_cat_tipoplan_fechacambio:{type: DataTypes.DATEONLY, allowNull: false},
        gym_cat_tipoplan_dias_totales:{type: DataTypes.INTEGER, allowNull: false},
        gym_cat_tipoplan_ingresos:{type: DataTypes.INTEGER , allowNull: false},
    },{
        tableName:"gym_cat_tipoplan",
        timestamps:false
    }
)