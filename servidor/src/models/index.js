import { GymPersona } from "./gym_persona.js";
import { GymAlumno } from "./gym_alumno.js";
import { GymCatTipoPlan } from "./gym_cat_tipoplan.js";
import { GymFechaDisponible } from "./gym_fecha_disponible.js";
import { GymDiaIngreso } from "./gym_dia_ingreso.js";
import { GymCatTipoPersona } from "./gym_cat_tipoPersona.js";
import { GymCatTipoDocumento } from "./Gym_Cat_TipoDocumento.js";
import { GymCatSexo } from "./gym_cat_sexo.js";
import { GymCatEstadoAlumno } from "./gym_cat_estado_alumno.js";
import { GymRol } from "./AuthRol.js";
import { GymUsuario } from "./AuthUsuario.js";
import { GymUsuarioRol } from "./AuthUsuarioRol.js";

// Persona ↔ Alumno (1 a 1)
GymPersona.hasOne(GymAlumno, {
  foreignKey: "gym_alumno_rela_persona",
  as: "alumno",
});
GymAlumno.belongsTo(GymPersona, {
  foreignKey: "gym_alumno_rela_persona",
  as: "persona",
});

// EstadoAlumno ↔ Alumno (1 a N)
GymCatEstadoAlumno.hasMany(GymAlumno, {
  foreignKey: "gym_alumno_rela_estadoalumno",
  as: "alumnos",
});
GymAlumno.belongsTo(GymCatEstadoAlumno, {
  foreignKey: "gym_alumno_rela_estadoalumno",
  as: "estado",
});

// Alumno ↔ FechaDisponible (1 a N)
GymAlumno.hasMany(GymFechaDisponible, {
  foreignKey: "gym_fecha_rela_alumno",
  as: "fechas_disponibles",
});
GymFechaDisponible.belongsTo(GymAlumno, {
  foreignKey: "gym_fecha_rela_alumno",
  as: "alumno",
});

// TipoPlan ↔ FechaDisponible (1 a N)
GymCatTipoPlan.hasMany(GymFechaDisponible, {
  foreignKey: "gym_fecha_rela_tipoplan",
  as: "fechas_disponibles",
});
GymFechaDisponible.belongsTo(GymCatTipoPlan, {
  foreignKey: "gym_fecha_rela_tipoplan",
  as: "tipo_plan",
});

// FechaDisponible ↔ DiaIngreso (1 a N)
GymFechaDisponible.hasMany(GymDiaIngreso, {
  foreignKey: "gym_dia_rela_fecha",
  as: "ingresos",
});
GymDiaIngreso.belongsTo(GymFechaDisponible, {
  foreignKey: "gym_dia_rela_fecha",
  as: "fecha_disponible",
});

// Login y seguridad

// Persona ↔ Usuario (1 a 1)
GymPersona.hasOne(GymUsuario, {
  foreignKey: "gym_usuario_rela_persona",
  as: "usuario",
});
GymUsuario.belongsTo(GymPersona, {
  foreignKey: "gym_usuario_rela_persona",
  as: "persona",
});

// Usuario ↔ Rol (N a N)
GymUsuario.belongsToMany(GymRol, {
  through: GymUsuarioRol,
  foreignKey: "gym_usuario_rol_rela_usuario",
  otherKey: "gym_usuario_rol_rela_rol",
  as: "roles",
});

GymRol.belongsToMany(GymUsuario, {
  through: GymUsuarioRol,
  foreignKey: "gym_usuario_rol_rela_rol",
  otherKey: "gym_usuario_rol_rela_usuario",
  as: "usuarios",
});

// MUY IMPORTANTE para includes directos desde GymUsuarioRol
GymUsuarioRol.belongsTo(GymUsuario, {
  foreignKey: "gym_usuario_rol_rela_usuario",
  as: "usuario",
});

GymUsuario.hasMany(GymUsuarioRol, {
  foreignKey: "gym_usuario_rol_rela_usuario",
  as: "usuarios_roles",
});

GymUsuarioRol.belongsTo(GymRol, {
  foreignKey: "gym_usuario_rol_rela_rol",
  as: "rol",
});

GymRol.hasMany(GymUsuarioRol, {
  foreignKey: "gym_usuario_rol_rela_rol",
  as: "usuarios_roles",
});

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
  GymCatTipoPersona,
  GymCatEstadoAlumno,
};