---
name: auth-rbac
description: Modifica autenticación (login, sesión, recuperación de contraseña) y permisos por rol en servidor y frontend. Usar para todo lo relacionado con usuarios, sesiones y permisos.
---

# Autenticación y roles

## Servidor
- `persona` (email) → `usuario` (`contrasena` con bcrypt, `activo`) → `usuario_rol` → `rol` (`super_admin`, `admin`, `staff`).
- JWT en `Authorization: Bearer` con `sub`, `persona_id` y `roles`; vence según `JWT_EXPIRES_IN` (7 días por el kiosco).
- Middlewares en `middleware/auth_middleware.js`: `requireAuth`, `requireRole(...roles)`.
- Login: mensaje genérico ("Email o contraseña incorrectos"), rate limit por IP + email.
- Recuperación de contraseña: token aleatorio de un solo uso, que venza, y misma respuesta exista o no el email.
  **Nunca** cambiar una contraseña sin probar que la persona es dueña de la cuenta.
- Nunca devolver `contrasena` (`attributes` explícitos).
- Sin cambios de base: si hiciera falta una columna (ej. versión de contraseña), preguntar.

## Frontend
- `auth/auth_context.jsx` + `useAuth()` (`usuario`, `cargando`, `isAuth`, `login`, `logout`).
- `http.js`: ante 401 limpia el token y lleva a `/login?expired=1&from=...`.
- `<ProtectedRoute roles={[...]}>`. Ocultar botones sin permiso es solo comodidad: la seguridad está en el servidor.

## Tests
Servidor: login correcto/incorrecto, `/me` con y sin token, 401/403 por rol (`src/routes/auth.test.js`).
Frontend: `protected_route.test.jsx`, `login_page.test.jsx`. E2E: `e2e/login.spec.js`.
