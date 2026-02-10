ALTER TABLE gym_dia_ingreso
ADD COLUMN gym_dia_horaingreso timestamp without time zone NOT NULL DEFAULT now();
-- Horario pico
BEGIN;

-- 1) Tabla roles
CREATE TABLE IF NOT EXISTS public.gym_rol (
  gym_rol_id SERIAL PRIMARY KEY,
  gym_rol_codigo TEXT NOT NULL UNIQUE,      -- 'admin', 'staff'
  gym_rol_descripcion TEXT,
  gym_rol_fechacambio TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

-- roles base
INSERT INTO public.gym_rol (gym_rol_codigo, gym_rol_descripcion)
VALUES
('admin', 'Administrador del gimnasio'),
('staff', 'Empleado / Recepción')
ON CONFLICT (gym_rol_codigo) DO NOTHING;

-- 2) Tabla puente usuario ↔ rol
CREATE TABLE IF NOT EXISTS public.gym_usuario_rol (
  gym_usuario_rol_id SERIAL PRIMARY KEY,
  gym_usuario_rol_rela_usuario INTEGER NOT NULL,
  gym_usuario_rol_rela_rol INTEGER NOT NULL,
  gym_usuario_rol_fechacambio TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),

  CONSTRAINT fk_usuario_rol_usuario
    FOREIGN KEY (gym_usuario_rol_rela_usuario)
    REFERENCES public.gym_usuario (gym_usuario_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_usuario_rol_rol
    FOREIGN KEY (gym_usuario_rol_rela_rol)
    REFERENCES public.gym_rol (gym_rol_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uq_usuario_rol UNIQUE (gym_usuario_rol_rela_usuario, gym_usuario_rol_rela_rol)
);

COMMIT;


--inserts 
BEGIN;

CREATE TABLE IF NOT EXISTS public.gym_rol (
  gym_rol_id SERIAL PRIMARY KEY,
  gym_rol_codigo TEXT NOT NULL UNIQUE,
  gym_rol_descripcion TEXT,
  gym_rol_fechacambio TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO public.gym_rol (gym_rol_codigo, gym_rol_descripcion)
VALUES
('admin', 'Administrador del gimnasio'),
('staff', 'Empleado / Recepción')
ON CONFLICT (gym_rol_codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.gym_usuario_rol (
  gym_usuario_rol_id SERIAL PRIMARY KEY,
  gym_usuario_rol_rela_usuario INTEGER NOT NULL,
  gym_usuario_rol_rela_rol INTEGER NOT NULL,
  gym_usuario_rol_fechacambio TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),

  CONSTRAINT fk_usuario_rol_usuario
    FOREIGN KEY (gym_usuario_rol_rela_usuario)
    REFERENCES public.gym_usuario (gym_usuario_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_usuario_rol_rol
    FOREIGN KEY (gym_usuario_rol_rela_rol)
    REFERENCES public.gym_rol (gym_rol_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT uq_usuario_rol UNIQUE (gym_usuario_rol_rela_usuario, gym_usuario_rol_rela_rol)
);

COMMIT;

-- Modificaciones a gym_usuario
ALTER TABLE public.gym_usuario
ADD COLUMN IF NOT EXISTS gym_usuario_activo BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.gym_usuario
ADD COLUMN IF NOT EXISTS gym_usuario_ultimo_login TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE public.gym_usuario
ADD CONSTRAINT IF NOT EXISTS uq_gym_usuario_persona UNIQUE (gym_usuario_rela_persona);



-- PERSONA ADMIN
INSERT INTO gym_persona (
  gym_persona_rela_tipodocumento,
  gym_persona_rela_sexo,
  gym_persona_rela_tipopersona,
  gym_persona_nombre,
  gym_persona_apellido,
  gym_persona_fechanacimiento,
  gym_persona_documento,
  gym_persona_email
)
VALUES (
  1, -- DNI
  1, -- Masculino (ajustar si querés)
  3, -- Tipo persona ADMINISTRADOR (según catálogo)
  'Admin',
  'Gym',
  '1990-01-01',
  10000001,
  'admin@gym.com'
)
ON CONFLICT (gym_persona_documento) DO NOTHING;


-- PERSONA SUPER ADMIN (DEV)
INSERT INTO gym_persona (
  gym_persona_rela_tipodocumento,
  gym_persona_rela_sexo,
  gym_persona_rela_tipopersona,
  gym_persona_nombre,
  gym_persona_apellido,
  gym_persona_fechanacimiento,
  gym_persona_documento,
  gym_persona_email
)
VALUES (
  1,
  1,
  3,
  'Super',
  'Admin',
  '1990-01-01',
  10000002,
  'dev@gym.com'
)
ON CONFLICT (gym_persona_documento) DO NOTHING;

-- ASIGNAR ROL ADMIN
INSERT INTO gym_usuario_rol (
  gym_usuario_rol_rela_usuario,
  gym_usuario_rol_rela_rol
)
SELECT
  u.gym_usuario_id,
  r.gym_rol_id
FROM gym_usuario u
JOIN gym_persona p ON p.gym_persona_id = u.gym_usuario_rela_persona
JOIN gym_rol r ON r.gym_rol_codigo = 'ADMIN'
WHERE p.gym_persona_email = 'admin@gym.com'
ON CONFLICT DO NOTHING;


-- ASIGNAR ROL SUPER ADMIN
INSERT INTO gym_usuario_rol (
  gym_usuario_rol_rela_usuario,
  gym_usuario_rol_rela_rol
)
SELECT
  u.gym_usuario_id,
  r.gym_rol_id
FROM gym_usuario u
JOIN gym_persona p ON p.gym_persona_id = u.gym_usuario_rela_persona
JOIN gym_rol r ON r.gym_rol_codigo = 'SUPER_ADMIN'
WHERE p.gym_persona_email = 'dev@gym.com'
ON CONFLICT DO NOTHING;
