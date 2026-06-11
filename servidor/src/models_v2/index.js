/**
 * models_v2/index.js
 *
 * Registro central de modelos y asociaciones para el schema v3.
 * Importar SOLO desde aquí — nunca importar modelos individuales directamente.
 *
 * Uso en server.js:
 *   import "../models_v2/index.js";  // efectos colaterales: registra asociaciones
 */

import { Sexo }            from "./sexo.js";
import { TipoDocumento }   from "./tipo_documento.js";
import { TipoPersona }     from "./tipo_persona.js";
import { AlumnoEstado }    from "./alumno_estado.js";
import { Rol }             from "./rol.js";
import { Modulo }          from "./modulo.js";
import { Permiso }         from "./permiso.js";
import { RolPermiso }      from "./rol_permiso.js";
import { Persona }         from "./persona.js";
import { Usuario }         from "./usuario.js";
import { UsuarioRol }      from "./usuario_rol.js";
import { PlanTipo }        from "./plan_tipo.js";
import { Alumno }          from "./alumno.js";
import { Membresia }       from "./membresia.js";
import { Ingreso }         from "./ingreso.js";
import { AlumnoEstadoLog } from "./alumno_estado_log.js";

// ─── Persona ↔ Catálogos ────────────────────────────────────────────────────
Persona.belongsTo(TipoDocumento, { foreignKey: "tipo_documento_id", as: "tipo_documento" });
Persona.belongsTo(Sexo,          { foreignKey: "sexo_id",           as: "sexo" });
Persona.belongsTo(TipoPersona,   { foreignKey: "tipo_persona_id",   as: "tipo_persona" });

// ─── Persona ↔ Alumno (1:1) ─────────────────────────────────────────────────
Persona.hasOne(Alumno, { foreignKey: "persona_id", as: "alumno" });
Alumno.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Alumno ↔ Estado ────────────────────────────────────────────────────────
Alumno.belongsTo(AlumnoEstado, { foreignKey: "estado_id", as: "estado" });
AlumnoEstado.hasMany(Alumno,   { foreignKey: "estado_id" });

// ─── Persona ↔ Usuario (1:1) ─────────────────────────────────────────────────
Persona.hasOne(Usuario, { foreignKey: "persona_id", as: "usuario" });
Usuario.belongsTo(Persona, { foreignKey: "persona_id", as: "persona" });

// ─── Usuario ↔ Rol (N:N) ─────────────────────────────────────────────────────
Usuario.belongsToMany(Rol, {
  through:     UsuarioRol,
  foreignKey:  "usuario_id",
  otherKey:    "rol_id",
  as:          "roles",
});
Rol.belongsToMany(Usuario, {
  through:     UsuarioRol,
  foreignKey:  "rol_id",
  otherKey:    "usuario_id",
  as:          "usuarios",
});

// ─── Módulo ↔ Permiso (1:N) ───────────────────────────────────────────────────
Modulo.hasMany(Permiso,    { foreignKey: "modulo_id", as: "permisos" });
Permiso.belongsTo(Modulo,  { foreignKey: "modulo_id", as: "modulo" });

// ─── Rol ↔ Permiso (N:N vía RolPermiso) ──────────────────────────────────────
Rol.belongsToMany(Permiso, {
  through:    RolPermiso,
  foreignKey: "rol_id",
  otherKey:   "permiso_id",
  as:         "permisos",
});
Permiso.belongsToMany(Rol, {
  through:    RolPermiso,
  foreignKey: "permiso_id",
  otherKey:   "rol_id",
  as:         "roles",
});

// ─── Alumno ↔ Membresia (1:N) ────────────────────────────────────────────────
Alumno.hasMany(Membresia,    { foreignKey: "alumno_id", as: "membresias" });
Membresia.belongsTo(Alumno,  { foreignKey: "alumno_id", as: "alumno" });

// ─── Membresia ↔ PlanTipo ────────────────────────────────────────────────────
Membresia.belongsTo(PlanTipo, { foreignKey: "plan_tipo_id", as: "plan_tipo" });
PlanTipo.hasMany(Membresia,   { foreignKey: "plan_tipo_id" });

// ─── Membresia ↔ Usuario (cobrado_por) ──────────────────────────────────────
Membresia.belongsTo(Usuario, { foreignKey: "cobrado_por_id", as: "cobrado_por" });

// ─── Membresia ↔ Ingreso (1:N) ───────────────────────────────────────────────
Membresia.hasMany(Ingreso,   { foreignKey: "membresia_id", as: "ingresos" });
Ingreso.belongsTo(Membresia, { foreignKey: "membresia_id", as: "membresia" });

// ─── AlumnoEstadoLog ─────────────────────────────────────────────────────────
AlumnoEstadoLog.belongsTo(Alumno,       { foreignKey: "alumno_id",          as: "alumno" });
AlumnoEstadoLog.belongsTo(AlumnoEstado, { foreignKey: "estado_anterior_id", as: "estado_anterior" });
AlumnoEstadoLog.belongsTo(AlumnoEstado, { foreignKey: "estado_nuevo_id",    as: "estado_nuevo" });
AlumnoEstadoLog.belongsTo(Usuario,      { foreignKey: "modificado_por",     as: "modificado_por_usuario" });
Alumno.hasMany(AlumnoEstadoLog,         { foreignKey: "alumno_id",          as: "estado_logs" });

export {
  Sexo, TipoDocumento, TipoPersona, AlumnoEstado,
  Rol, Modulo, Permiso, RolPermiso,
  Persona, Usuario, UsuarioRol,
  PlanTipo, Alumno, Membresia, Ingreso, AlumnoEstadoLog,
};
