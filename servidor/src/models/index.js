import { GymPersona } from "./gym_persona.js";
import { GymAlumno } from "./gym_alumno.js";
import { GymCatTipoPlan } from "./gym_cat_tipoplan.js";
import { GymFechaDisponible } from "./gym_fecha_disponible.js";
import { GymDiaIngreso } from "./gym_dia_ingreso.js";
import { GymCatTipoPersona } from "./gym_cat_tipoPersona.js";
import { GymCatTipoDocumento } from "./Gym_Cat_TipoDocumento.js";
import { GymCatSexo } from "./gym_cat_sexo.js";

import { GymRol } from "./AuthRol.js";
import { GymUsuario } from "./AuthUsuario.js";
import { GymUsuarioRol } from "./AuthUsuarioRol.js";



// Persona ↔ Alumno (1 a 1)
GymPersona.hasOne(GymAlumno, { foreignKey: "gym_alumno_rela_persona" });
GymAlumno.belongsTo(GymPersona, { foreignKey: "gym_alumno_rela_persona" });

// Alumno ↔ FechaDisponible (1 a N)  (un alumno puede tener muchos planes en el tiempo)
GymAlumno.hasMany(GymFechaDisponible, { foreignKey: "gym_fecha_rela_alumno" });
GymFechaDisponible.belongsTo(GymAlumno, { foreignKey: "gym_fecha_rela_alumno" });

// TipoPlan ↔ FechaDisponible (1 a N)  (un tipo de plan se usa en muchos registros de fecha)
GymCatTipoPlan.hasMany(GymFechaDisponible, { foreignKey: "gym_fecha_rela_tipoplan" });
GymFechaDisponible.belongsTo(GymCatTipoPlan, { foreignKey: "gym_fecha_rela_tipoplan" });

// FechaDisponible ↔ DiaIngreso (1 a N)  (un plan/fecha tiene muchos ingresos registrados)
GymFechaDisponible.hasMany(GymDiaIngreso, { foreignKey: "gym_dia_rela_fecha" });
GymDiaIngreso.belongsTo(GymFechaDisponible, { foreignKey: "gym_dia_rela_fecha" });

//Login y seguridad
// Persona ↔ Usuario (1 a 1)
GymPersona.hasOne(GymUsuario, { foreignKey: "gym_usuario_rela_persona" });
GymUsuario.belongsTo(GymPersona, { foreignKey: "gym_usuario_rela_persona" });

// Usuario ↔ Rol (N a N)
GymUsuario.belongsToMany(GymRol, {
  through: GymUsuarioRol,
  foreignKey: "gym_usuario_rol_rela_usuario",
  otherKey: "gym_usuario_rol_rela_rol",
});

GymRol.belongsToMany(GymUsuario, {
  through: GymUsuarioRol,
  foreignKey: "gym_usuario_rol_rela_rol",
  otherKey: "gym_usuario_rol_rela_usuario",
});

;
export {
  GymRol,
  GymUsuario,
  GymUsuarioRol,
  GymPersona,
  GymAlumno,
  GymCatTipoPlan,
  GymFechaDisponible,
  GymDiaIngreso,
  GymCatSexo,
  GymCatTipoDocumento,
  GymCatTipoPersona
};
