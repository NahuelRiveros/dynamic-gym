import { Persona } from "./persona.js";
import { Alumno } from "./alumno.js";
import { PlanTipo } from "./plan_tipo.js";
import { Membresia } from "./membresia.js";
import { Ingreso } from "./ingreso.js";
import { TipoPersona } from "./tipo_persona.js";
import { TipoDocumento } from "./tipo_documento.js";
import { Sexo } from "./sexo.js";
import { AlumnoEstado } from "./alumno_estado.js";
import { Rol } from "./rol.js";
import { Usuario } from "./usuario.js";
import { UsuarioRol } from "./usuario_rol.js";
import { AlumnoEstadoLog } from "./alumno_estado_log.js";

// Persona ↔ Alumno (1 a 1)
Persona.hasOne(Alumno, { foreignKey: "persona_id", as: "alumno" });
Alumno.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// EstadoAlumno ↔ Alumno (1 a N)
AlumnoEstado.hasMany(Alumno, { foreignKey: "estado_id", as: "alumnos" });
Alumno.belongsTo(AlumnoEstado, { foreignKey: "estado_id", as: "estado" });

// Alumno ↔ Membresia (1 a N)
Alumno.hasMany(Membresia, { foreignKey: "alumno_id", as: "membresias" });
Membresia.belongsTo(Alumno, { foreignKey: "alumno_id", as: "alumno" });

// PlanTipo ↔ Membresia (1 a N)
PlanTipo.hasMany(Membresia, { foreignKey: "plan_tipo_id", as: "membresias" });
Membresia.belongsTo(PlanTipo, { foreignKey: "plan_tipo_id", as: "plan_tipo" });

// Membresia ↔ Ingreso (1 a N)
Membresia.hasMany(Ingreso, { foreignKey: "membresia_id", as: "ingresos" });
Ingreso.belongsTo(Membresia, { foreignKey: "membresia_id", as: "membresia" });

// Persona ↔ Usuario (1 a 1)
Persona.hasOne(Usuario, { foreignKey: "persona_id", as: "usuario" });
Usuario.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// Usuario ↔ Rol (N a N)
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: "usuario_id",
  otherKey: "rol_id",
  as: "roles",
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: "rol_id",
  otherKey: "usuario_id",
  as: "usuarios",
});

// Acceso directo a la tabla pivote
UsuarioRol.belongsTo(Usuario, { foreignKey: "usuario_id", as: "usuario" });
Usuario.hasMany(UsuarioRol, { foreignKey: "usuario_id", as: "usuarios_roles" });
UsuarioRol.belongsTo(Rol, { foreignKey: "rol_id", as: "rol" });
Rol.hasMany(UsuarioRol, { foreignKey: "rol_id", as: "usuarios_roles" });

// AlumnoEstadoLog (sin include, solo para bootstrap)
Alumno.hasMany(AlumnoEstadoLog, { foreignKey: "alumno_id", as: "estado_logs" });
AlumnoEstadoLog.belongsTo(Alumno, { foreignKey: "alumno_id", as: "alumno" });

export {
  Rol,
  Usuario,
  UsuarioRol,
  Persona,
  Alumno,
  PlanTipo,
  Membresia,
  Ingreso,
  Sexo,
  TipoDocumento,
  TipoPersona,
  AlumnoEstado,
  AlumnoEstadoLog,
};
