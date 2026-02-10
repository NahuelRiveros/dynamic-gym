CREATE TABLE auth_usuario (
  auth_usuario_id SERIAL PRIMARY KEY,
  auth_usuario_rela_persona INTEGER NOT NULL UNIQUE,
  auth_usuario_password TEXT NOT NULL,
  auth_usuario_activo BOOLEAN NOT NULL DEFAULT true,
  auth_usuario_ultimo_login TIMESTAMP,
  auth_usuario_fechacambio TIMESTAMP DEFAULT now()
);
CREATE TABLE auth_rol (
  auth_rol_id SERIAL PRIMARY KEY,
  auth_rol_codigo TEXT NOT NULL UNIQUE,   -- admin, staff, user
  auth_rol_descripcion TEXT,
  auth_rol_fechacambio TIMESTAMP DEFAULT now()
);
CREATE TABLE auth_usuario_rol (
  auth_usuario_rol_id SERIAL PRIMARY KEY,
  auth_usuario_rol_rela_usuario INTEGER NOT NULL,
  auth_usuario_rol_rela_rol INTEGER NOT NULL,
  auth_usuario_rol_fechacambio TIMESTAMP DEFAULT now(),
  UNIQUE (auth_usuario_rol_rela_usuario, auth_usuario_rol_rela_rol)
);


src/
 ├─ auth/
 │   ├─ auth.controller.js
 │   ├─ auth.service.js
 │   ├─ auth.middleware.js
 │   └─ auth.routes.js
 ├─ models/
 │   ├─ auth_usuario.js
 │   ├─ auth_rol.js
 │   ├─ auth_usuario_rol.js
 │   ├─ gym_persona.js