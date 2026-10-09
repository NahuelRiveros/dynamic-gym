# CLAUDE.md — Dynamic Gym

Sistema de gestión de un gimnasio **en producción**: alumnos, planes (membresías), ingreso por DNI
en el kiosco, pagos, recaudación y estadísticas, ventas de mercadería (stock), staff, suscripción
del software y promociones por mail.

Las bases de trabajo (tests, e2e, skills, reglas) vienen de la plantilla de e-commerce
(`../MI_eccomerce - Stilos`). Este archivo es la **fuente de verdad** para este proyecto.

## ⚠️ La base de datos NO se modifica

La base está en producción (Neon) con datos reales. Por eso:

- **Prohibido** crear o cambiar tablas, columnas, índices, triggers, vistas o modelos
  (`servidor/src/models_v2/`), y prohibido `sync()` en cualquier forma.
- **Prohibido** agregar archivos a `servidor/src/database/*.sql` o tocar `migration_runner.js`.
  En `database/sequelize.js` solo se ajusta la conexión (pool, `search_path`, zona horaria de la sesión).
- Las relaciones entre modelos también están en `models_v2/index.js`: si falta una, se arma la
  consulta desde otra relación que sí exista (ver `listarStaff`), no se agrega.
- Sí se puede: optimizar **cómo se consulta** (menos consultas, `attributes` explícitos, evitar N+1,
  SQL con `replacements`), caché en memoria o en el frontend, y todo el código del frontend.
- Si una mejora necesitara cambiar la base, **se propone y se pregunta**; nunca se aplica.
- Nunca correr scripts de `servidor/scripts/` contra producción.

### Dos esquemas
- `gym_v3`: el actual. Lo usan todos los modelos (`search_path` = `gym_v3, public`).
- `public`: el esquema viejo (antes de renombrar tablas). Lo leen algunas estadísticas y
  `admin_planes_alumno_service`, y **sigue en uso** para la suscripción del software
  (`public.software_suscripcion`, `public.software_pago`).

### Neon (cobra por tiempo despierta; se duerme a los ~5 min sin consultas)
- No agregar tareas periódicas que consulten la base sin necesidad. El cron de estados corre cada hora.
- `/api/health` no consulta la base (`/api/health?bd=1` sí). El pool cierra las conexiones sin uso (`min: 0`).
- Preferir caché antes que consultar de nuevo: `nucleo/cache.js` (catálogos, 10 min, se limpia al
  editar un plan), `suscripcion_middleware` (estado 5 min), TanStack Query en el frontend.
- Filtros por año como rango de fechas (`>= make_date(:anio,1,1) AND < make_date(:anio+1,1,1)`),
  no `EXTRACT(YEAR ...)`: así se usan los índices.

### Hora argentina
Cada conexión del pool hace `SET TIME ZONE 'America/Argentina/Cordoba'` (`database/sequelize.js`):
`CURRENT_DATE` y `now()` son de Argentina. En JavaScript, "hoy" siempre con
`timeZone: "America/Argentina/Buenos_Aires"` (el servidor de Render está en UTC).

## Stack

| Capa        | Tecnología                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Lenguaje    | **JavaScript (ESM). NO usar TypeScript** (ni `.ts`/`.tsx`).                |
| Frontend    | `frontend/` — Vite + React 19 + Tailwind CSS 4 + React Router 7            |
| Datos (web) | TanStack Query + axios (`src/api/http.js`)                                 |
| Formularios | React Hook Form + Zod                                                      |
| Servidor    | `servidor/` — Node + Express 5 + Sequelize 6 + PostgreSQL (Neon)           |
| Tests       | Vitest + Supertest (servidor), Vitest + Testing Library + MSW (web), Playwright (E2E) |
| Deploy      | Render (API: `cd servidor && npm ci`) + Vercel (web: `vercel.json`)        |

No hay workspaces de npm: cada carpeta instala lo suyo (así lo esperan Render y Vercel). La raíz
solo tiene herramientas (ESLint, Playwright, concurrently) y atajos.

## Comandos (desde la raíz)

```bash
npm run instalar      # raíz + servidor + frontend
npm run dev           # API (http://localhost:3001) + web (http://localhost:5173)
npm test              # tests del servidor y del frontend
npm run test:api      # solo servidor (base local dynamicgym_auto_test, ver abajo)
npm run test:web      # solo frontend (sin servidor: MSW responde todo)
npm run test:e2e      # Playwright: levanta API :3101 y web :5175 sobre dynamicgym_e2e_auto_test
npm run lint          # ESLint en todo el proyecto (config en la raíz)
npm run build         # build del frontend
```

### Bases de los tests (nunca Neon)
- `servidor/.env.test` (no se sube; copiar `servidor/.env.test.example`): Postgres **local**.
- Cada corrida **borra y rearma** `dynamicgym_auto_test` (Vitest) o `dynamicgym_e2e_auto_test`
  (Playwright) con el SQL de `servidor/src/database/`, la estructura (sin datos) de lo que
  producción tiene aparte (`servidor/tests/estructura_produccion.sql`: esquema `public` y la vista
  de recaudación) y usuarios/alumnos de prueba (`servidor/tests/armar_base.js`). Los tests
  comparten la base: un test que modifica un alumno usa uno propio (ej. `ALUMNOS_TEST.ajusteManual`).
- Candado (`servidor/tests/base_test.js`): si el host no es local o el nombre no termina en
  `_auto_test`, los tests no corren. `dynamicgym_test` tiene una **copia de datos reales**: no se toca.

## Definición de "terminado"

1. `npm run lint` y los tests afectados pasan — mostrar la salida real, no suponerla.
2. Tests nuevos para la lógica nueva (caso feliz + al menos un caso de error).
3. La base de datos no cambió (ver arriba).
4. Sin `console.log` de depuración, sin código comentado, sin archivos sin usar.

## Estructura actual

```
servidor/src/
  server.js / app.js           # arranque y app Express (createApp, usada también por los tests)
  routes/ → controllers/ → services/   # capas; la lógica y el SQL viven en services
  nucleo/                      # errores, manejador_errores, validar (Zod), responder, consultas, cache, zod
  models_v2/                   # modelos Sequelize (schema gym_v3) — NO modificar
  middleware/                  # auth (requireAuth, requireRole), suscripción, seed_token
  cron/                        # estados de alumnos
  configuracion_servidor/env.js# único lugar que lee process.env
  database/                    # conexión y SQL de arranque — NO modificar
servidor/tests/                # base de test, candado, datos de prueba
frontend/src/
  app/ (router, query_client, pantallas.js: ruta + roles + menú de cada pantalla, única fuente)
  auth/ (auth_context, permisos.js: tieneRol, menú por rol)  api/ (una por dominio)  config/
  pages/                       # pantallas, una carpeta por área: inicio/, auth/, kiosco/, alumnos/,
                               #   pagos/, consulta/ (pública), suscripcion/ (vuelta de Mercado Pago),
                               #   admin/, estadisticas/, ventas/, super_admin/ — nada suelto en la raíz
  components/ui/               # primitivas comunes: data_grid/ (tabla + tarjetas en celular), modal,
                               #   confirm_dialog, botones_modal, lista_errores — usar antes de crear otra
  components/sistema/          # aviso_servidor (Render dormido / sin conexión)
  components/                  # form/, modal/ (formularios del panel sobre ui/modal), layout/, alertas/
  hook/                        # datos (use_<dominio>.js con TanStack Query) y utilidades (use_filtros,
                               #   use_valor_demorado, use_cuenta_regresiva, use_consulta_media)
  test/                        # setup, servidor_mock (MSW), renderizar
e2e/                           # Playwright
```


---

## Reglas JavaScript

- JavaScript puro, ESM, `const` por defecto, nunca `var`, `async/await`, `===`, `?.` y `??`.
- Archivos nuevos en `snake_case` (`alumno_card.jsx`); componentes en `PascalCase`.
- Nombres del dominio en español (`alumno`, `membresia`, `ingreso`, `plan`).
- Funciones con más de 2 parámetros reciben un objeto.
- Comentarios: el **por qué** de las decisiones de negocio, breve. No comentar lo obvio.
- Nada de código muerto ni carpetas "por las dudas": lo que se descarta se borra (queda en git).

## Reglas React (`frontend/`)

- Componentes funcionales, uno exportado por archivo, props desestructuradas con valores por defecto.
- **Nada de axios en componentes**: las llamadas van en `src/api/<dominio>_api.js` y los datos se
  usan con los hooks de TanStack Query de `src/hook/use_<dominio>.js` (alumnos, estadisticas,
  recaudacion, planes, staff, stock, suscripcion, promociones, catalogos). **Nunca** `useEffect` +
  fetch (ESLint lo marca como error: `set-state-in-effect`).
  - Cada hook tiene sus claves (`planesKeys`, `stockKeys`...) y las mutaciones invalidan lo que
    cambian (un plan también refresca catálogos y estadísticas; un pago, alumnos y recaudación).
  - Respuestas `{ ok: false }` → `exigirOk()`; mensaje para mostrar → `mensajeDeError()` (`hook/consultas_utils.js`).
  - Error de carga: `components/ui/estado_error.jsx` (con Reintentar). Error al guardar: dentro del
    modal (`errorServidor`), nunca detrás. Confirmaciones: `ConfirmDialog`, nunca `window.confirm`.
  - Filtros con botón "Actualizar": `hook/use_filtros.js`. Búsquedas al servidor: `useValorDemorado` (300 ms).
  - Neon: nada de consultas periódicas cortas. Lo que casi no cambia, con `staleTime` largo
    (catálogos 5 min, suscripción y cumpleaños 1 h).
- Efectos que no cargan datos (timers, listeners): `useEffectEvent` para llamar funciones del
  componente (ver `hook/use_cuenta_regresiva.js`). Estado inicial desde props: valor inicial de
  `useState` en un componente que se monta al abrir, no un efecto que lo copia.
- Hooks siempre antes de cualquier `return`.
- Siempre los 3 estados: cargando, error (mensaje + reintentar), vacío.
- Formularios: React Hook Form + `zodResolver`.
- Reutilizar `components/` antes de crear algo nuevo; componentes de más de ~200 líneas → dividir.
- Listados: `components/ui/data_grid/data_grid.jsx` (en celular, una tarjeta por fila; marcar con
  `principal: true` la columna que va de título). Ventanas: `components/ui/modal.jsx`, con el
  formulario adentro como componente aparte (se monta al abrir: sin `useEffect` que copie props a estado).
- Accesible: `label` en inputs, `alt` en imágenes, botones reales, navegable con teclado.
- Fechas: zona `America/Argentina/Buenos_Aires` (el negocio funciona en hora argentina).

## Reglas Node.js (`servidor/`)

- Capas `routes → controllers → services`. El servicio tiene la lógica y es el único que usa modelos/SQL.
- **Validación en la ruta**: `validar({ body, query, params })` de `nucleo/validar.js` con schemas
  Zod (importar `z`, `dni()`, `idPositivo()` de `nucleo/zod.js`, mensajes en español). Responde
  400 `VALIDACION`; el controlador lee los datos limpios de `req.datos.body/query/params`.
- **Controladores sin try/catch** (Express 5 manda los errores al `nucleo/manejador_errores.js`,
  que responde 500 sin detalles). Los servicios devuelven `{ ok: false, codigo, ... }` para errores
  de negocio, y el controlador elige el status con `responderResultado(res, r, { NO_EXISTE: 404 })`.
  Errores de configuración o de reglas: `throw new ErrorApp({ status, codigo, mensaje })`.
- **No cambiar la forma de las respuestas OK**: el frontend las lee tal cual.
- `process.env` solo en `configuracion_servidor/env.js`.
- SQL crudo con `replacements`/`bind`. **Prohibido interpolar datos del usuario con `${}`**;
  nombres de columnas u orden solo desde una lista blanca. Búsquedas "contiene" con
  `patronContiene()` de `nucleo/consultas.js` (escapa `%` y `_`).
- Rutas públicas o con secretos: rate limit (login, consulta pública, `seed_token.js`).
- Allowlist de campos al crear/actualizar; nunca `Modelo.create(req.body)`.
- Todo lo que toca dinero, ingresos o estados va en una transacción.
- Respuestas `{ ok, codigo, mensaje, ... }`, mensajes al usuario en español, sin stack ni errores crudos de la base.
- Roles: `super_admin`, `admin`, `staff`. El servidor valida permisos aunque el frontend oculte el botón.

## Seguridad (no negociable)

- Nunca commitear `.env` ni credenciales. **No leer ni mostrar el contenido de `.env`.**
- Variables `VITE_*` son públicas: nunca secretos ahí.
- Mercado Pago y SMTP apagados en tests (`vitest.config.js`, `playwright.config.js`).

## Forma de trabajar del agente

- Mostrar el plan antes de tocar más de 5 archivos.
- Buscar primero si ya existe un componente, hook o servicio reutilizable.
- Cambios mínimos y enfocados; no refactorizar código no relacionado sin pedirlo.
- Reglas de negocio ambiguas (planes, ingresos, estados, pagos): **preguntar**, no inventar.
- No hacer commit ni push sin confirmación. Trabajo en la rama `rama_base`.
- Explicar en español simple lo que se hizo; el dueño del proyecto está aprendiendo.
