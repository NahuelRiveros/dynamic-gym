---
name: api-endpoint
description: Crea o modifica un endpoint REST en Express (route, controller, service) con validación, autorización por rol y tests con Supertest contra la base local de test. Sin tocar la base de datos.
argument-hint: <MÉTODO /ruta — descripción, ej. "GET /api/alumnos/:id/ingresos — historial (admin, staff)">
---

# Endpoint: $ARGUMENTS

Antes de empezar: si el endpoint necesitara una tabla o columna nueva, **parar y preguntar** (la base está en producción y no se modifica).

1. **Servicio** (`servidor/src/services/<dominio>_service.js`): reglas de negocio; único lugar con modelos o SQL.
   - `attributes` explícitos; nunca devolver `contrasena`.
   - SQL crudo con `replacements`; nada de `${}` con datos del usuario.
   - `sequelize.transaction()` si toca ingresos, dinero o varias tablas.
   - Pensar en Neon: una consulta con `include`/JOIN antes que varias en un bucle.
2. **Controlador** (`controllers/`): toma `req`, llama al servicio y responde `{ ok, codigo, mensaje, ... }`.
   Sin lógica de negocio.
3. **Ruta** (`routes/`): `requireAuth`, `requireRole(...)`, rate limit si es sensible. Rutas fijas antes de `/:id`.
   Registrar en `routes/index.js`.
4. **Validación**: revisar tipos y formato de body/query/params (hasta tener `validar()` con Zod, en el controlador).
5. **Tests** (`<nombre>.test.js` junto a la ruta, Supertest con `createApp()`):
   - caso feliz (status + forma de la respuesta)
   - 400 por datos inválidos, 401 sin sesión, 403 con rol incorrecto
   - 404 / 409 según reglas de negocio
   - datos de `servidor/tests/armar_base.js`; `afterAll(() => sequelize.close())`
6. `npm run test:api` y mostrar la salida.
7. Informar el contrato (método, ruta, rol, entrada, respuesta, errores) para el frontend.
