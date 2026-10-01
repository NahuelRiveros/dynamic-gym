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
   - Errores de negocio: `return { ok: false, codigo: "NO_EXISTE", mensaje }`. Configuración o reglas
     que cortan todo: `throw new ErrorApp({ status, codigo, mensaje })` (`nucleo/errores.js`).
   - Búsquedas "contiene": `patronContiene(q)` (`nucleo/consultas.js`). Filtros por año: rango de fechas.
2. **Controlador** (`controllers/`): **sin try/catch** y sin lógica. Lee `req.datos.*`, llama al servicio
   y responde con `responderResultado(res, r, { CODIGO: status })` o `res.json(...)`.
3. **Ruta** (`routes/`): `requireAuth`, `requireRole(...)`, `validar({ body, query, params })` con un
   schema Zod (`z`, `dni()`, `idPositivo()` de `nucleo/zod.js`), rate limit si es pública o sensible.
   Rutas fijas antes de `/:id`. Registrar en `routes/index.js`.
4. **Respuestas**: si el endpoint ya existe, la forma de la respuesta OK **no cambia** (el frontend la lee tal cual).
5. **Tests** (`<nombre>.test.js` junto a la ruta, Supertest con `createApp()`, sesión con `tokenDe()` de `tests/sesiones.js`):
   - caso feliz (status + forma de la respuesta)
   - 400 por datos inválidos, 401 sin sesión, 403 con rol incorrecto
   - 404 / 409 según reglas de negocio
   - datos de `servidor/tests/armar_base.js` (si el test modifica un alumno, agregar uno propio ahí);
     `afterAll(() => sequelize.close())`
6. `npm run test:api` y mostrar la salida.
7. Informar el contrato (método, ruta, rol, entrada, respuesta, errores) para el frontend.
