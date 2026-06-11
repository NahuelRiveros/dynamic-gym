-- =============================================================================
-- SCHEMA V3 — Dynamic Gym
-- Schema normalizado, con constraints reales, índices y triggers correctos.
-- Diseñado para ser ejecutado en una base de datos NUEVA y vacía.
-- =============================================================================
-- Uso:
--   psql -U postgres -d nueva_base -f schema_v3.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- CATÁLOGOS (tablas de referencia — datos estáticos o rara vez cambian)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sexo (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(50) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  sexo IS 'Catálogo de géneros. Usado en persona.sexo_id.';

CREATE TABLE IF NOT EXISTS tipo_documento (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  tipo_documento IS 'Catálogo de tipos de documento (DNI, Pasaporte, etc.).';

CREATE TABLE IF NOT EXISTS tipo_persona (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  tipo_persona IS 'Catálogo de categorías de persona (Alumno, Profesor, etc.).';

CREATE TABLE IF NOT EXISTS alumno_estado (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  alumno_estado IS 'Estados posibles de un alumno: Activo (1), Inactivo (2), Suspendido (3).';

CREATE TABLE IF NOT EXISTS rol (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  rol IS 'Roles del sistema. El código se embebe en el JWT y se usa en los guards de ruta.';
COMMENT ON COLUMN rol.codigo IS 'Identificador de negocio: admin | staff | custom. Se usa en el JWT y en requirePermiso().';

-- ─────────────────────────────────────────────────────────────────────────────
-- MÓDULOS — Secciones funcionales del sistema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS modulo (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  orden       SMALLINT     NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  modulo IS 'Secciones del sistema (alumnos, pagos, estadisticas, etc.). Agrupa permisos para la UI.';
COMMENT ON COLUMN modulo.orden IS 'Orden de aparición en el panel de gestión de roles.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PERMISO — Acción específica dentro de un módulo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS permiso (
  id          SERIAL        PRIMARY KEY,
  modulo_id   INT           NOT NULL REFERENCES modulo(id),
  codigo      VARCHAR(100)  NOT NULL UNIQUE,
  accion      VARCHAR(50)   NOT NULL,
  descripcion VARCHAR(200)  NOT NULL,
  creado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (modulo_id, accion)
);
COMMENT ON TABLE  permiso IS 'Permiso atómico del sistema. codigo = ''modulo:accion'', ej: ''alumnos:editar''.';
COMMENT ON COLUMN permiso.codigo IS 'Formato modulo:accion. Es el valor que el middleware evalúa en requirePermiso().';
COMMENT ON COLUMN permiso.accion IS 'Acción dentro del módulo: leer | crear | editar | registrar | gestionar | enviar, etc.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ROL_PERMISO — Asignación de permisos a roles
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rol_permiso (
  id         SERIAL      PRIMARY KEY,
  rol_id     INT         NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
  permiso_id INT         NOT NULL REFERENCES permiso(id) ON DELETE CASCADE,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rol_id, permiso_id)
);
COMMENT ON TABLE  rol_permiso IS 'Asigna permisos a roles. ON DELETE CASCADE: al borrar un rol/permiso se limpia la asignación.';
COMMENT ON COLUMN rol_permiso.rol_id IS 'Todos los usuarios con este rol heredan el permiso.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PERSONA — Datos personales de cualquier individuo en el sistema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS persona (
  id                  SERIAL       PRIMARY KEY,
  tipo_documento_id   INT          NOT NULL REFERENCES tipo_documento(id),
  sexo_id             INT          REFERENCES sexo(id),
  tipo_persona_id     INT          REFERENCES tipo_persona(id),
  nombre              VARCHAR(100) NOT NULL,
  apellido            VARCHAR(100) NOT NULL,
  fecha_nacimiento    DATE,
  documento           VARCHAR(20)  NOT NULL UNIQUE,
  email               VARCHAR(150) UNIQUE,
  celular             VARCHAR(30),
  celular_emergencia  VARCHAR(30),
  creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  persona IS 'Datos personales base. Una persona puede ser alumno y/o usuario del sistema.';
COMMENT ON COLUMN persona.documento IS 'Número de documento. Único por tipo — índice para búsqueda en kiosco.';
COMMENT ON COLUMN persona.email IS 'Email de contacto. Único, usado también como login si la persona tiene usuario.';

-- ─────────────────────────────────────────────────────────────────────────────
-- USUARIO — Credenciales de acceso al sistema (admins y staff)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usuario (
  id             SERIAL       PRIMARY KEY,
  persona_id     INT          NOT NULL UNIQUE REFERENCES persona(id),
  contrasena     VARCHAR(255) NOT NULL,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_login   TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  usuario IS 'Credenciales de acceso. Relación 1:1 con persona. Solo tiene entrada si puede iniciar sesión.';
COMMENT ON COLUMN usuario.contrasena IS 'Hash bcrypt. Nunca almacenar texto plano.';

CREATE TABLE IF NOT EXISTS usuario_rol (
  id         SERIAL      PRIMARY KEY,
  usuario_id INT         NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  rol_id     INT         NOT NULL REFERENCES rol(id),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, rol_id)
);
COMMENT ON TABLE  usuario_rol IS 'Tabla de unión N:N entre usuario y rol. UNIQUE evita roles duplicados.';

-- ─────────────────────────────────────────────────────────────────────────────
-- PLAN_TIPO — Tipos de planes de entrenamiento disponibles
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_tipo (
  id             SERIAL        PRIMARY KEY,
  descripcion    VARCHAR(100)  NOT NULL UNIQUE,
  dias_totales   INT           NOT NULL CHECK (dias_totales > 0),
  ingresos       INT           NOT NULL CHECK (ingresos >= 0),
  precio         DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  plan_tipo IS 'Catálogo de planes: Mensual, Trimestral, etc. Define el precio y límites de uso.';
COMMENT ON COLUMN plan_tipo.ingresos IS 'Cantidad máxima de ingresos permitidos (0 = ilimitado).';
COMMENT ON COLUMN plan_tipo.dias_totales IS 'Duración del plan en días desde la fecha de inicio.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ALUMNO — Vínculo entre persona y su historial en el gimnasio
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alumno (
  id                     SERIAL      PRIMARY KEY,
  persona_id             INT         NOT NULL UNIQUE REFERENCES persona(id),
  estado_id              INT         NOT NULL REFERENCES alumno_estado(id),
  fecha_registro         DATE        NOT NULL DEFAULT CURRENT_DATE,
  certificado_apt_fisica BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  alumno IS 'Extiende persona con datos específicos del rol alumno. Relación 1:1 con persona.';
COMMENT ON COLUMN alumno.estado_id IS 'Estado actual: Activo=1 (determinado por cron o pago registrado).';
COMMENT ON COLUMN alumno.certificado_apt_fisica IS 'Indica si presentó certificado médico de aptitud física.';
-- NOTA: plan_tipo_id fue eliminado. El plan activo se obtiene desde la membresía vigente.

-- ─────────────────────────────────────────────────────────────────────────────
-- MEMBRESIA — Registro de pago y vigencia de un plan (era gym_fecha_disponible)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membresia (
  id                   SERIAL        PRIMARY KEY,
  alumno_id            INT           NOT NULL REFERENCES alumno(id),
  plan_tipo_id         INT           NOT NULL REFERENCES plan_tipo(id),
  cobrado_por_id       INT           NOT NULL REFERENCES usuario(id),
  monto_pagado         DECIMAL(10,2) NOT NULL CHECK (monto_pagado >= 0),
  metodo_pago          VARCHAR(30)   NOT NULL DEFAULT 'efectivo',
  fecha_inicio         DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin            DATE          NOT NULL,
  dias_totales         INT           NOT NULL CHECK (dias_totales > 0),
  ingresos_disponibles INT           NOT NULL CHECK (ingresos_disponibles >= 0),
  creado_en            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_membresia_fechas CHECK (fecha_fin >= fecha_inicio)
);
COMMENT ON TABLE  membresia IS 'Cada fila es un pago registrado. Define el período de vigencia del alumno en el gym.';
COMMENT ON COLUMN membresia.cobrado_por_id IS 'Usuario (staff/admin) que registró el cobro. Obligatorio para auditoría.';
COMMENT ON COLUMN membresia.ingresos_disponibles IS 'Contador decremental de ingresos restantes en este período.';
COMMENT ON COLUMN membresia.metodo_pago IS 'Valores esperados: efectivo | transferencia | debito | credito.';

-- ─────────────────────────────────────────────────────────────────────────────
-- INGRESO — Registro de cada acceso físico al gimnasio (era gym_dia_ingreso)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingreso (
  id            SERIAL      PRIMARY KEY,
  membresia_id  INT         NOT NULL REFERENCES membresia(id),
  fecha_ingreso DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora_ingreso  TIME        NOT NULL DEFAULT CURRENT_TIME,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  ingreso IS 'Log de asistencia. Cada fila = un acceso físico al gym dentro de una membresía.';

-- ─────────────────────────────────────────────────────────────────────────────
-- ALUMNO_ESTADO_LOG — Historial de cambios de estado del alumno
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alumno_estado_log (
  id                 SERIAL      PRIMARY KEY,
  alumno_id          INT         NOT NULL REFERENCES alumno(id),
  estado_anterior_id INT         REFERENCES alumno_estado(id),
  estado_nuevo_id    INT         NOT NULL REFERENCES alumno_estado(id),
  motivo             VARCHAR(255),
  fuente             VARCHAR(50),
  modificado_por     INT         REFERENCES usuario(id),
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  alumno_estado_log IS 'Auditoría de cambios de estado. Inmutable — nunca se actualiza ni elimina.';
COMMENT ON COLUMN alumno_estado_log.fuente IS 'Origen del cambio: cron | pago | manual.';
COMMENT ON COLUMN alumno_estado_log.modificado_por IS 'NULL si el cambio fue automático (cron).';

-- =============================================================================
-- ÍNDICES
-- =============================================================================

-- persona: búsqueda frecuente por documento (kiosco) y por nombre
CREATE INDEX IF NOT EXISTS idx_persona_documento       ON persona(documento);
CREATE INDEX IF NOT EXISTS idx_persona_email           ON persona(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persona_apellido_nombre ON persona(apellido, nombre);

-- alumno: FK + filtros frecuentes por estado
CREATE INDEX IF NOT EXISTS idx_alumno_persona_id ON alumno(persona_id);
CREATE INDEX IF NOT EXISTS idx_alumno_estado_id  ON alumno(estado_id);

-- membresia: FK + fechas (consultas de vigencia son la query más frecuente)
CREATE INDEX IF NOT EXISTS idx_membresia_alumno_id    ON membresia(alumno_id);
CREATE INDEX IF NOT EXISTS idx_membresia_plan_tipo_id ON membresia(plan_tipo_id);
CREATE INDEX IF NOT EXISTS idx_membresia_fecha_fin    ON membresia(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_membresia_fecha_inicio ON membresia(fecha_inicio);

-- ingreso: FK + fecha para estadísticas de asistencia
CREATE INDEX IF NOT EXISTS idx_ingreso_membresia_id  ON ingreso(membresia_id);
CREATE INDEX IF NOT EXISTS idx_ingreso_fecha_ingreso ON ingreso(fecha_ingreso);

-- usuario_rol: búsqueda por usuario al resolver permisos
CREATE INDEX IF NOT EXISTS idx_usuario_rol_usuario_id ON usuario_rol(usuario_id);

-- log: búsqueda por alumno para ver historial
CREATE INDEX IF NOT EXISTS idx_estado_log_alumno_id ON alumno_estado_log(alumno_id);

-- permisos: FK + búsqueda por módulo
CREATE INDEX IF NOT EXISTS idx_permiso_modulo_id    ON permiso(modulo_id);
CREATE INDEX IF NOT EXISTS idx_rol_permiso_rol_id   ON rol_permiso(rol_id);
CREATE INDEX IF NOT EXISTS idx_rol_permiso_perm_id  ON rol_permiso(permiso_id);

-- =============================================================================
-- TRIGGER: auto-actualizar actualizado_en al hacer UPDATE
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION fn_set_actualizado_en IS 'Setea actualizado_en = NOW() en cualquier UPDATE. Una sola función para todas las tablas.';

DO $$
DECLARE
  tablas TEXT[] := ARRAY['persona', 'alumno', 'plan_tipo', 'membresia', 'usuario'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_actualizado_en_%I ON %I;
       CREATE TRIGGER trg_actualizado_en_%I
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION fn_set_actualizado_en();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- =============================================================================
-- SEED: datos iniciales de catálogos
-- =============================================================================

INSERT INTO sexo (descripcion) VALUES ('Masculino'), ('Femenino'), ('Otro')
  ON CONFLICT (descripcion) DO NOTHING;

INSERT INTO tipo_documento (descripcion) VALUES ('DNI'), ('Pasaporte'), ('CUIL'), ('Cédula')
  ON CONFLICT (descripcion) DO NOTHING;

INSERT INTO tipo_persona (descripcion) VALUES ('Alumno'), ('Profesor'), ('Administrativo')
  ON CONFLICT (descripcion) DO NOTHING;

INSERT INTO alumno_estado (descripcion) VALUES ('Activo'), ('Inactivo'), ('Suspendido')
  ON CONFLICT (descripcion) DO NOTHING;

INSERT INTO rol (codigo, descripcion) VALUES
  ('admin', 'Administrador — acceso total'),
  ('staff', 'Personal — registro de pagos y consulta de alumnos')
  ON CONFLICT (codigo) DO NOTHING;

-- ─── Módulos ─────────────────────────────────────────────────────────────────
INSERT INTO modulo (codigo, descripcion, orden) VALUES
  ('alumnos',      'Gestión de Alumnos',            10),
  ('pagos',        'Registro de Pagos',              20),
  ('ingresos',     'Control de Ingresos',            30),
  ('estadisticas', 'Estadísticas y Reportes',        40),
  ('recaudacion',  'Recaudación',                    50),
  ('planes',       'Gestión de Planes',              60),
  ('staff',        'Gestión de Personal',            70),
  ('admin',        'Administración del Sistema',     80),
  ('promociones',  'Comunicaciones y Promociones',   90)
ON CONFLICT (codigo) DO NOTHING;

-- ─── Permisos ─────────────────────────────────────────────────────────────────
INSERT INTO permiso (modulo_id, codigo, accion, descripcion)
SELECT m.id, p.codigo, p.accion, p.descripcion
FROM (VALUES
  -- alumnos
  ('alumnos', 'alumnos:leer',          'leer',        'Ver lista y detalle de alumnos'),
  ('alumnos', 'alumnos:crear',         'crear',        'Registrar nuevos alumnos'),
  ('alumnos', 'alumnos:editar',        'editar',       'Modificar datos de alumnos'),
  -- pagos
  ('pagos',   'pagos:leer',            'leer',         'Ver historial de pagos'),
  ('pagos',   'pagos:registrar',       'registrar',    'Registrar nuevos pagos / membresías'),
  -- ingresos
  ('ingresos','ingresos:leer',         'leer',         'Ver registro de ingresos al gym'),
  -- estadisticas
  ('estadisticas','estadisticas:leer', 'leer',         'Ver estadísticas, gráficos y métricas'),
  -- recaudacion
  ('recaudacion','recaudacion:leer',   'leer',         'Ver calendario de recaudación mensual'),
  -- planes
  ('planes',  'planes:leer',           'leer',         'Ver catálogo de planes disponibles'),
  ('planes',  'planes:gestionar',      'gestionar',    'Crear, editar y desactivar planes'),
  -- staff
  ('staff',   'staff:leer',            'leer',         'Ver lista de personal del sistema'),
  ('staff',   'staff:gestionar',       'gestionar',    'Crear y gestionar cuentas de personal'),
  -- admin
  ('admin',   'admin:usuarios',        'usuarios',     'Gestión completa de usuarios y roles'),
  ('admin',   'admin:roles',           'roles',        'Crear roles y asignar / quitar permisos'),
  ('admin',   'admin:suscripcion',     'suscripcion',  'Ver y gestionar la suscripción del software'),
  -- promociones
  ('promociones','promociones:enviar', 'enviar',       'Enviar emails masivos a alumnos activos')
) AS p(modulo_codigo, codigo, accion, descripcion)
JOIN modulo m ON m.codigo = p.modulo_codigo
ON CONFLICT (codigo) DO NOTHING;

-- ─── Asignar permisos a roles ─────────────────────────────────────────────────

-- admin: TODOS los permisos
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r, permiso p
WHERE r.codigo = 'admin'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- staff: permisos operativos del día a día
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN (
  'alumnos:leer', 'alumnos:crear', 'alumnos:editar',
  'pagos:leer',   'pagos:registrar',
  'ingresos:leer'
)
WHERE r.codigo = 'staff'
ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- =============================================================================
-- FIN
-- =============================================================================
