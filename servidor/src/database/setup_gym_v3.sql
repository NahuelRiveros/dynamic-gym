-- =============================================================================
-- SETUP INICIAL GYM_V3
-- Se ejecuta automáticamente en el primer arranque cuando gym_v3 no existe.
-- Idempotente: usa IF NOT EXISTS / ON CONFLICT DO NOTHING en todas partes.
-- NO depende del schema public (funciona en DB vacía).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Schema
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS gym_v3;

-- ─────────────────────────────────────────────────────────────────────────────
-- Catálogos simples
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_v3.sexo (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(50) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.tipo_documento (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.tipo_persona (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.alumno_estado (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(80) NOT NULL UNIQUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.rol (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RBAC (módulos/permisos — estructura reservada para uso futuro)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_v3.modulo (
  id          SERIAL       PRIMARY KEY,
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  descripcion VARCHAR(150) NOT NULL,
  orden       SMALLINT     NOT NULL DEFAULT 0,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.permiso (
  id          SERIAL        PRIMARY KEY,
  modulo_id   INT           NOT NULL REFERENCES gym_v3.modulo(id),
  codigo      VARCHAR(100)  NOT NULL UNIQUE,
  accion      VARCHAR(50)   NOT NULL,
  descripcion VARCHAR(200)  NOT NULL,
  creado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (modulo_id, accion)
);

CREATE TABLE IF NOT EXISTS gym_v3.rol_permiso (
  id         SERIAL      PRIMARY KEY,
  rol_id     INT         NOT NULL REFERENCES gym_v3.rol(id) ON DELETE CASCADE,
  permiso_id INT         NOT NULL REFERENCES gym_v3.permiso(id) ON DELETE CASCADE,
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rol_id, permiso_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Personas y usuarios
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_v3.persona (
  id                  SERIAL       PRIMARY KEY,
  tipo_documento_id   INT          NOT NULL REFERENCES gym_v3.tipo_documento(id),
  sexo_id             INT          REFERENCES gym_v3.sexo(id),
  tipo_persona_id     INT          REFERENCES gym_v3.tipo_persona(id),
  nombre              VARCHAR(100) NOT NULL,
  apellido            VARCHAR(100) NOT NULL,
  fecha_nacimiento    DATE,
  documento           VARCHAR(20)  NOT NULL UNIQUE,
  email               VARCHAR(150) UNIQUE,
  celular             VARCHAR(30),
  celular_emergencia  VARCHAR(30),
  creado_en           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  eliminado_en        TIMESTAMPTZ  NULL
);

CREATE TABLE IF NOT EXISTS gym_v3.usuario (
  id             SERIAL       PRIMARY KEY,
  persona_id     INT          NOT NULL UNIQUE REFERENCES gym_v3.persona(id),
  contrasena     VARCHAR(255) NOT NULL,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_login   TIMESTAMPTZ,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  eliminado_en   TIMESTAMPTZ  NULL
);

CREATE TABLE IF NOT EXISTS gym_v3.usuario_rol (
  id         SERIAL      PRIMARY KEY,
  usuario_id INT         NOT NULL REFERENCES gym_v3.usuario(id) ON DELETE CASCADE,
  rol_id     INT         NOT NULL REFERENCES gym_v3.rol(id),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, rol_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Planes y alumnos
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gym_v3.plan_tipo (
  id             SERIAL        PRIMARY KEY,
  descripcion    VARCHAR(100)  NOT NULL UNIQUE,
  dias_totales   INT           NOT NULL CHECK (dias_totales > 0),
  ingresos       INT           NOT NULL CHECK (ingresos >= 0),
  precio         DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.alumno (
  id                     SERIAL      PRIMARY KEY,
  persona_id             INT         NOT NULL UNIQUE REFERENCES gym_v3.persona(id),
  estado_id              INT         NOT NULL REFERENCES gym_v3.alumno_estado(id),
  fecha_registro         DATE        NOT NULL DEFAULT CURRENT_DATE,
  certificado_apt_fisica BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado_en           TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS gym_v3.membresia (
  id                   SERIAL        PRIMARY KEY,
  alumno_id            INT           NOT NULL REFERENCES gym_v3.alumno(id),
  plan_tipo_id         INT           NOT NULL REFERENCES gym_v3.plan_tipo(id),
  cobrado_por_id       INT           REFERENCES gym_v3.usuario(id),
  monto_pagado         DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
  metodo_pago          VARCHAR(30)   NOT NULL DEFAULT 'efectivo',
  fecha_inicio         DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin            DATE          NOT NULL,
  dias_totales         INT           NOT NULL CHECK (dias_totales > 0),
  ingresos_disponibles INT           NOT NULL CHECK (ingresos_disponibles >= 0),
  creado_en            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_membresia_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS gym_v3.ingreso (
  id            SERIAL      PRIMARY KEY,
  membresia_id  INT         NOT NULL REFERENCES gym_v3.membresia(id),
  fecha_ingreso DATE        NOT NULL DEFAULT CURRENT_DATE,
  hora_ingreso  TIME        NOT NULL DEFAULT CURRENT_TIME,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.alumno_estado_log (
  id                 SERIAL      PRIMARY KEY,
  alumno_id          INT         NOT NULL REFERENCES gym_v3.alumno(id),
  estado_anterior_id INT         REFERENCES gym_v3.alumno_estado(id),
  estado_nuevo_id    INT         NOT NULL REFERENCES gym_v3.alumno_estado(id),
  motivo             VARCHAR(255),
  fuente             VARCHAR(50),
  modificado_por     INT         REFERENCES gym_v3.usuario(id),
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Índices
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_v3_persona_documento       ON gym_v3.persona(documento);
CREATE INDEX IF NOT EXISTS idx_v3_persona_email           ON gym_v3.persona(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_v3_persona_apellido_nombre ON gym_v3.persona(apellido, nombre);
CREATE INDEX IF NOT EXISTS idx_v3_alumno_persona_id       ON gym_v3.alumno(persona_id);
CREATE INDEX IF NOT EXISTS idx_v3_alumno_estado_id        ON gym_v3.alumno(estado_id);
CREATE INDEX IF NOT EXISTS idx_v3_membresia_alumno_id     ON gym_v3.membresia(alumno_id);
CREATE INDEX IF NOT EXISTS idx_v3_membresia_plan_tipo_id  ON gym_v3.membresia(plan_tipo_id);
CREATE INDEX IF NOT EXISTS idx_v3_membresia_fecha_fin     ON gym_v3.membresia(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_v3_membresia_fecha_inicio  ON gym_v3.membresia(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_v3_ingreso_membresia_id    ON gym_v3.ingreso(membresia_id);
CREATE INDEX IF NOT EXISTS idx_v3_ingreso_fecha_ingreso   ON gym_v3.ingreso(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_v3_usuario_rol_usuario_id  ON gym_v3.usuario_rol(usuario_id);
CREATE INDEX IF NOT EXISTS idx_v3_estado_log_alumno_id    ON gym_v3.alumno_estado_log(alumno_id);
CREATE INDEX IF NOT EXISTS idx_v3_permiso_modulo_id       ON gym_v3.permiso(modulo_id);
CREATE INDEX IF NOT EXISTS idx_v3_rol_permiso_rol_id      ON gym_v3.rol_permiso(rol_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger actualizado_en
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION gym_v3.fn_set_actualizado_en()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tablas TEXT[] := ARRAY['persona','alumno','plan_tipo','membresia','usuario'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_actualizado_en_%I ON gym_v3.%I;
       CREATE TRIGGER trg_actualizado_en_%I
         BEFORE UPDATE ON gym_v3.%I
         FOR EACH ROW EXECUTE FUNCTION gym_v3.fn_set_actualizado_en();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed catálogos (datos mínimos para que el sistema funcione)
-- ON CONFLICT DO NOTHING = idempotente
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.sexo (id, descripcion) VALUES
  (1, 'Masculino'),
  (2, 'Femenino'),
  (3, 'Otro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.tipo_documento (id, descripcion) VALUES
  (1, 'DNI'),
  (2, 'Pasaporte'),
  (3, 'CI')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.tipo_persona (id, descripcion) VALUES
  (1, 'Alumno'),
  (2, 'Staff')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.alumno_estado (id, descripcion) VALUES
  (1, 'Habilitado'),
  (2, 'Restringido')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.rol (id, codigo, descripcion) VALUES
  (1, 'admin',       'Administrador'),
  (2, 'staff',       'Staff'),
  (3, 'super_admin', 'Super Administrador del sistema')
ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.plan_tipo (id, descripcion, dias_totales, ingresos, precio, activo) VALUES
  (1, 'Mensual 3 días/semana', 30, 12, 0, TRUE),
  (2, 'Mensual libre',         30, 30, 0, TRUE),
  (3, 'Quincenal',             15, 15, 0, TRUE),
  (4, 'Semanal',                7,  7, 0, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Resetear sequences para evitar colisiones con los IDs insertados
SELECT setval('gym_v3.sexo_id_seq',          (SELECT MAX(id) FROM gym_v3.sexo));
SELECT setval('gym_v3.tipo_documento_id_seq', (SELECT MAX(id) FROM gym_v3.tipo_documento));
SELECT setval('gym_v3.tipo_persona_id_seq',   (SELECT MAX(id) FROM gym_v3.tipo_persona));
SELECT setval('gym_v3.alumno_estado_id_seq',  (SELECT MAX(id) FROM gym_v3.alumno_estado));
SELECT setval('gym_v3.rol_id_seq',            (SELECT MAX(id) FROM gym_v3.rol));
SELECT setval('gym_v3.plan_tipo_id_seq',      (SELECT MAX(id) FROM gym_v3.plan_tipo));
