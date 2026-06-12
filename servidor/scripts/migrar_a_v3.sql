-- =============================================================================
-- MIGRACIÓN AL SCHEMA GYM_V3
-- =============================================================================
-- Qué hace este script:
--   1. Crea el schema gym_v3 en la base de datos existente
--   2. Crea todas las tablas del schema v3 dentro de gym_v3
--   3. Copia catálogos (todos)
--   4. Copia personas: usuarios del sistema + alumnos con actividad últimos 3 meses
--   5. Copia alumnos con actividad en los últimos 3 meses
--   6. Copia membresías de los últimos 3 meses (operativo reciente)
--   7. Copia ingresos de los últimos 3 meses
--   8. Copia usuarios y roles (admin/staff — todos)
--   9. Seed de módulos, permisos y rol_permiso (RBAC nuevo)
--  10. Crea vista unificada de recaudación (public + gym_v3)
--  11. Resetea sequences para que los nuevos registros no colisionen
--
-- Lo que NO toca:
--   El schema public queda INTACTO como archivo histórico de recaudación.
--
-- Cómo ejecutarlo (local):
--   psql -U postgres -d dynamicgym -f migrar_a_v3.sql
--
-- Cómo ejecutarlo (Render — en la consola SQL del dashboard):
--   Copiar y pegar el contenido, o usar psql con DATABASE_URL.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 0: Crear el schema gym_v3
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS gym_v3;
SET LOCAL search_path = gym_v3;

DO $$ BEGIN RAISE NOTICE '✅ Schema gym_v3 creado / verificado'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Crear tablas en gym_v3 (idempotente con IF NOT EXISTS)
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
  cobrado_por_id       INT           NOT NULL REFERENCES gym_v3.usuario(id),
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

DO $$ BEGIN RAISE NOTICE '✅ Tablas creadas en gym_v3'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Índices
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
-- PASO 3: Trigger actualizado_en
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

DO $$ BEGIN RAISE NOTICE '✅ Índices y triggers creados'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Copiar catálogos desde public
-- (ON CONFLICT DO NOTHING = idempotente)
-- ─────────────────────────────────────────────────────────────────────────────

-- Las tablas de public no tienen creado_en (solo actualizado_en) — usamos NOW() como fallback
INSERT INTO gym_v3.sexo (id, descripcion, creado_en)
  SELECT id, descripcion, COALESCE(actualizado_en, NOW()) FROM public.sexo
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.tipo_documento (id, descripcion, creado_en)
  SELECT id, descripcion, COALESCE(actualizado_en, NOW()) FROM public.tipo_documento
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.tipo_persona (id, descripcion, creado_en)
  SELECT id, descripcion, COALESCE(actualizado_en, NOW()) FROM public.tipo_persona
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.alumno_estado (id, descripcion, creado_en)
  SELECT id, descripcion, COALESCE(actualizado_en, NOW()) FROM public.alumno_estado
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.rol (id, codigo, descripcion, creado_en)
  SELECT id, codigo, descripcion, COALESCE(actualizado_en, NOW()) FROM public.rol
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.plan_tipo (id, descripcion, dias_totales, ingresos, precio, activo, creado_en, actualizado_en)
  SELECT id, descripcion, dias_totales, ingresos, precio, activo, actualizado_en, actualizado_en
  FROM public.plan_tipo
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Catálogos copiados'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: Copiar personas
-- Incluye: (a) usuarios del sistema (admin/staff) + (b) alumnos activos 3 meses
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.persona (
  id, tipo_documento_id, sexo_id, tipo_persona_id,
  nombre, apellido, fecha_nacimiento, documento, email,
  celular, celular_emergencia,
  creado_en, actualizado_en
)
SELECT DISTINCT ON (p.id)
  p.id,
  -- Si el registro viejo no tiene tipo_documento, asignar DNI (id=1) como fallback
  COALESCE(p.tipo_documento_id, 1),
  p.sexo_id,
  p.tipo_persona_id,
  p.nombre,
  p.apellido,
  p.fecha_nacimiento::date,
  p.documento,
  p.email,
  p.celular,
  p.celular_emergencia,
  COALESCE(p.actualizado_en, NOW()),
  COALESCE(p.actualizado_en, NOW())
FROM public.persona p
WHERE
  -- (a) Es usuario del sistema (admin/staff)
  EXISTS (
    SELECT 1 FROM public.usuario u WHERE u.persona_id = p.id
  )
  OR
  -- (b) Es alumno con actividad en los últimos 3 meses
  EXISTS (
    SELECT 1
    FROM public.alumno a
    JOIN public.membresia m ON m.alumno_id = a.id
    WHERE a.persona_id = p.id
      AND m.fecha_fin >= CURRENT_DATE - INTERVAL '3 months'
  )
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Personas copiadas: %', (SELECT COUNT(*) FROM gym_v3.persona); END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: Copiar usuarios y sus roles
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.usuario (id, persona_id, contrasena, activo, ultimo_login, creado_en, actualizado_en)
  SELECT u.id, u.persona_id, u.contrasena, u.activo, u.ultimo_login,
         COALESCE(u.actualizado_en, NOW()), COALESCE(u.actualizado_en, NOW())
  FROM public.usuario u
  WHERE EXISTS (SELECT 1 FROM gym_v3.persona gp WHERE gp.id = u.persona_id)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO gym_v3.usuario_rol (id, usuario_id, rol_id, creado_en)
  SELECT ur.id, ur.usuario_id, ur.rol_id, COALESCE(ur.actualizado_en, NOW())
  FROM public.usuario_rol ur
  WHERE EXISTS (SELECT 1 FROM gym_v3.usuario gu WHERE gu.id = ur.usuario_id)
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Usuarios copiados: %', (SELECT COUNT(*) FROM gym_v3.usuario); END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 7: Copiar alumnos con actividad en los últimos 3 meses
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.alumno (id, persona_id, estado_id, fecha_registro, certificado_apt_fisica, creado_en, actualizado_en)
  SELECT DISTINCT ON (a.id)
    a.id, a.persona_id, a.estado_id, a.fecha_registro::date,
    -- El campo era text en el schema viejo — castear a boolean de forma segura
    CASE WHEN a.certificado_apt_fisica::text ILIKE ANY(ARRAY['true','t','1','si','sí','yes']) THEN TRUE ELSE FALSE END,
    COALESCE(a.actualizado_en, NOW()), COALESCE(a.actualizado_en, NOW())
  FROM public.alumno a
  WHERE EXISTS (
    SELECT 1 FROM public.membresia m
    WHERE m.alumno_id = a.id
      AND m.fecha_fin >= CURRENT_DATE - INTERVAL '3 months'
  )
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Alumnos copiados: %', (SELECT COUNT(*) FROM gym_v3.alumno); END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 8: Copiar membresías (últimos 3 meses)
-- Solo las membresías recientes — el historial completo vive en public
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.membresia (
  id, alumno_id, plan_tipo_id, cobrado_por_id,
  monto_pagado, metodo_pago, fecha_inicio, fecha_fin,
  dias_totales, ingresos_disponibles,
  creado_en, actualizado_en
)
SELECT
  m.id, m.alumno_id, m.plan_tipo_id,
  -- cobrado_por_id era nullable en el schema viejo; en gym_v3 es NOT NULL.
  -- Si es NULL o el usuario no existe en gym_v3, usar el primer admin disponible.
  CASE
    WHEN m.cobrado_por_id IS NOT NULL
         AND EXISTS(SELECT 1 FROM gym_v3.usuario WHERE id = m.cobrado_por_id)
    THEN m.cobrado_por_id
    ELSE (SELECT id FROM gym_v3.usuario ORDER BY id LIMIT 1)
  END,
  m.monto_pagado, m.metodo_pago, m.fecha_inicio::date, m.fecha_fin::date,
  m.dias_totales, m.ingresos_disponibles,
  COALESCE(m.actualizado_en, NOW()), COALESCE(m.actualizado_en, NOW())
FROM public.membresia m
WHERE
  m.fecha_fin >= CURRENT_DATE - INTERVAL '3 months'
  AND EXISTS (SELECT 1 FROM gym_v3.alumno ga WHERE ga.id = m.alumno_id)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Membresías copiadas: %', (SELECT COUNT(*) FROM gym_v3.membresia); END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 9: Copiar ingresos (últimos 3 meses)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.ingreso (id, membresia_id, fecha_ingreso, hora_ingreso, creado_en)
  SELECT i.id, i.membresia_id, i.fecha_ingreso,
         i.hora_ingreso,
         (i.fecha_ingreso + COALESCE(i.creado_en, '00:00:00'::time)) AT TIME ZONE 'America/Argentina/Cordoba'
  FROM public.ingreso i
  WHERE i.fecha_ingreso >= CURRENT_DATE - INTERVAL '3 months'
    AND EXISTS (SELECT 1 FROM gym_v3.membresia gm WHERE gm.id = i.membresia_id)
  ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Ingresos copiados: %', (SELECT COUNT(*) FROM gym_v3.ingreso); END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 10: Seed RBAC — módulos, permisos y rol_permiso
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO gym_v3.modulo (codigo, descripcion, orden) VALUES
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

INSERT INTO gym_v3.permiso (modulo_id, codigo, accion, descripcion)
SELECT m.id, p.codigo, p.accion, p.descripcion
FROM (VALUES
  ('alumnos',      'alumnos:leer',          'leer',        'Ver lista y detalle de alumnos'),
  ('alumnos',      'alumnos:crear',         'crear',        'Registrar nuevos alumnos'),
  ('alumnos',      'alumnos:editar',        'editar',       'Modificar datos de alumnos'),
  ('pagos',        'pagos:leer',            'leer',         'Ver historial de pagos'),
  ('pagos',        'pagos:registrar',       'registrar',    'Registrar nuevos pagos'),
  ('ingresos',     'ingresos:leer',         'leer',         'Ver registro de ingresos al gym'),
  ('estadisticas', 'estadisticas:leer',     'leer',         'Ver estadísticas y gráficos'),
  ('recaudacion',  'recaudacion:leer',      'leer',         'Ver calendario de recaudación'),
  ('planes',       'planes:leer',           'leer',         'Ver catálogo de planes'),
  ('planes',       'planes:gestionar',      'gestionar',    'Crear, editar y desactivar planes'),
  ('staff',        'staff:leer',            'leer',         'Ver lista de personal'),
  ('staff',        'staff:gestionar',       'gestionar',    'Crear y gestionar cuentas de personal'),
  ('admin',        'admin:usuarios',        'usuarios',     'Gestión completa de usuarios y roles'),
  ('admin',        'admin:roles',           'roles',        'Crear roles y asignar permisos'),
  ('admin',        'admin:suscripcion',     'suscripcion',  'Gestión de suscripción del software'),
  ('promociones',  'promociones:enviar',    'enviar',       'Enviar emails masivos a alumnos')
) AS p(modulo_codigo, codigo, accion, descripcion)
JOIN gym_v3.modulo m ON m.codigo = p.modulo_codigo
ON CONFLICT (codigo) DO NOTHING;

-- admin: todos los permisos
INSERT INTO gym_v3.rol_permiso (rol_id, permiso_id)
  SELECT r.id, p.id FROM gym_v3.rol r, gym_v3.permiso p WHERE r.codigo = 'admin'
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

-- staff: permisos operativos
INSERT INTO gym_v3.rol_permiso (rol_id, permiso_id)
  SELECT r.id, p.id FROM gym_v3.rol r
  JOIN gym_v3.permiso p ON p.codigo IN (
    'alumnos:leer','alumnos:crear','alumnos:editar',
    'pagos:leer','pagos:registrar','ingresos:leer'
  )
  WHERE r.codigo = 'staff'
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ RBAC seed completo'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 11: Resetear sequences para que nuevos inserts no colisionen con IDs migrados
-- ─────────────────────────────────────────────────────────────────────────────

SELECT setval(pg_get_serial_sequence('gym_v3.sexo',             'id'), COALESCE((SELECT MAX(id) FROM gym_v3.sexo), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.tipo_documento',   'id'), COALESCE((SELECT MAX(id) FROM gym_v3.tipo_documento), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.tipo_persona',     'id'), COALESCE((SELECT MAX(id) FROM gym_v3.tipo_persona), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.alumno_estado',    'id'), COALESCE((SELECT MAX(id) FROM gym_v3.alumno_estado), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.rol',              'id'), COALESCE((SELECT MAX(id) FROM gym_v3.rol), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.modulo',           'id'), COALESCE((SELECT MAX(id) FROM gym_v3.modulo), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.permiso',          'id'), COALESCE((SELECT MAX(id) FROM gym_v3.permiso), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.rol_permiso',      'id'), COALESCE((SELECT MAX(id) FROM gym_v3.rol_permiso), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.persona',          'id'), COALESCE((SELECT MAX(id) FROM gym_v3.persona), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.usuario',          'id'), COALESCE((SELECT MAX(id) FROM gym_v3.usuario), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.usuario_rol',      'id'), COALESCE((SELECT MAX(id) FROM gym_v3.usuario_rol), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.plan_tipo',        'id'), COALESCE((SELECT MAX(id) FROM gym_v3.plan_tipo), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.alumno',           'id'), COALESCE((SELECT MAX(id) FROM gym_v3.alumno), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.membresia',        'id'), COALESCE((SELECT MAX(id) FROM gym_v3.membresia), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.ingreso',          'id'), COALESCE((SELECT MAX(id) FROM gym_v3.ingreso), 1));
SELECT setval(pg_get_serial_sequence('gym_v3.alumno_estado_log','id'), COALESCE((SELECT MAX(id) FROM gym_v3.alumno_estado_log), 1));

DO $$ BEGIN RAISE NOTICE '✅ Sequences reseteadas'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 12: Vista unificada de recaudación (histórico public + operativo gym_v3)
-- El backend y el frontend consultan esta vista — no necesitan saber de los schemas.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW gym_v3.vista_recaudacion_completa AS
  -- Recaudación histórica (schema public — intacto, solo lectura)
  SELECT
    'historico'                                  AS origen,
    m.id,
    p.apellido || ', ' || p.nombre               AS alumno,
    p.documento::TEXT                            AS dni,
    pt.descripcion                               AS plan,
    m.monto_pagado,
    m.metodo_pago::TEXT,
    m.fecha_inicio,
    m.fecha_fin,
    m.dias_totales,
    m.ingresos_disponibles
  FROM public.membresia m
  JOIN public.alumno    a  ON a.id  = m.alumno_id
  JOIN public.persona   p  ON p.id  = a.persona_id
  LEFT JOIN public.plan_tipo pt ON pt.id = m.plan_tipo_id

  UNION ALL

  -- Recaudación operativa nueva (schema gym_v3)
  -- Excluye registros que ya existen en public para evitar duplicados
  SELECT
    'actual'                                     AS origen,
    m.id,
    p.apellido || ', ' || p.nombre               AS alumno,
    p.documento::TEXT                            AS dni,
    pt.descripcion                               AS plan,
    m.monto_pagado,
    m.metodo_pago,
    m.fecha_inicio,
    m.fecha_fin,
    m.dias_totales,
    m.ingresos_disponibles
  FROM gym_v3.membresia m
  JOIN gym_v3.alumno    a  ON a.id  = m.alumno_id
  JOIN gym_v3.persona   p  ON p.id  = a.persona_id
  LEFT JOIN gym_v3.plan_tipo pt ON pt.id = m.plan_tipo_id
  WHERE m.id NOT IN (SELECT id FROM public.membresia);

DO $$ BEGIN RAISE NOTICE '✅ Vista vista_recaudacion_completa creada'; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RESUMEN FINAL
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_personas   INT;
  v_alumnos    INT;
  v_usuarios   INT;
  v_membresias INT;
  v_ingresos   INT;
BEGIN
  SELECT COUNT(*) INTO v_personas   FROM gym_v3.persona;
  SELECT COUNT(*) INTO v_alumnos    FROM gym_v3.alumno;
  SELECT COUNT(*) INTO v_usuarios   FROM gym_v3.usuario;
  SELECT COUNT(*) INTO v_membresias FROM gym_v3.membresia;
  SELECT COUNT(*) INTO v_ingresos   FROM gym_v3.ingreso;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  MIGRACIÓN COMPLETADA';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  personas   migradas : %', v_personas;
  RAISE NOTICE '  alumnos    migrados : %', v_alumnos;
  RAISE NOTICE '  usuarios   migrados : %', v_usuarios;
  RAISE NOTICE '  membresías migradas : %', v_membresias;
  RAISE NOTICE '  ingresos   migrados : %', v_ingresos;
  RAISE NOTICE '────────────────────────────────────────';
  RAISE NOTICE '  schema public: INTACTO (solo lectura)';
  RAISE NOTICE '  recaudación histórica: vista_recaudacion_completa';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

COMMIT;
