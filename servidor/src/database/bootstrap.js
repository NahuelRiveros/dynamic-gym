import {
  Sexo,
  TipoDocumento,
  TipoPersona,
  AlumnoEstado,
  PlanTipo,
  Rol,
  Persona,
  Alumno,
  Usuario,
  Membresia,
  Ingreso,
  UsuarioRol,
  AlumnoEstadoLog,
} from "../models/index.js";

export async function bootstrap_database() {
  console.log("🛠️  Iniciando bootstrap...");
  await sincronizar_modelos();
  console.log("✅ Bootstrap finalizado correctamente");
}

async function sincronizar_modelos() {
  const modelos_en_orden = [
    // ── Catálogos — sin dependencias externas ────────────────────────────────
    Sexo,           // sexo
    TipoDocumento,  // tipo_documento
    TipoPersona,    // tipo_persona
    AlumnoEstado,   // alumno_estado
    PlanTipo,       // plan_tipo
    Rol,               // rol

    // ── Nivel 1 — depende de catálogos ───────────────────────────────────────
    Persona,           // persona → sexo, tipo_documento, tipo_persona

    // ── Nivel 2 — depende de persona ─────────────────────────────────────────
    Alumno,            // alumno → persona, alumno_estado
    Usuario,           // usuario → persona

    // ── Nivel 3 — depende de alumno + plan_tipo + usuario ────────────────────
    Membresia,   // membresia → alumno, plan_tipo, usuario

    // ── Nivel 4 — depende de membresia ───────────────────────────────────────
    Ingreso,        // ingreso → membresia

    // ── Log de estados ───────────────────────────────────────────────────────
    AlumnoEstadoLog,      // alumno_estado_log → alumno

    // ── Junction N:N — van al final ───────────────────────────────────────────
    UsuarioRol,        // usuario_rol → usuario, rol
  ];

  for (const model of modelos_en_orden) {
    try {
      await model.sync({ alter: true });
      console.log(`✅ Tabla sincronizada: ${model.tableName}`);
    } catch (error) {
      console.error(`❌ Error en tabla ${model.tableName}:`, error.message);
      throw error;
    }
  }
}
