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
- No agregar tareas periódicas que consulten la base sin necesidad.
- Preferir caché (`suscripcion_middleware` guarda el estado 5 min; TanStack Query en el frontend)
  antes que consultar de nuevo.

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
  (Playwright) con el SQL de `servidor/src/database/` y usuarios/alumnos de prueba
  (`servidor/tests/armar_base.js`).
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
  models_v2/                   # modelos Sequelize (schema gym_v3) — NO modificar
  middleware/                  # auth (requireAuth, requireRole), suscripción
  cron/                        # estados de alumnos
  configuracion_servidor/env.js# único lugar que lee process.env
  database/                    # conexión y SQL de arranque — NO modificar
servidor/tests/                # base de test, candado, datos de prueba
frontend/src/
  app/ (router, query_client)  auth/ (auth_context)  api/ (una por dominio)  config/
  pages/                       # pantallas (admin/, estadisticas/, ventas/, super_admin/)
  components/                  # form/, modal/, layout/, table/, feedback/, ui/, alertas/
  test/                        # setup, servidor_mock (MSW), renderizar
e2e/                           # Playwright
```

Hacia dónde va (por etapas, sin tocar la base): errores centralizados y validación Zod en el
servidor; `components/ui/` como única fuente de primitivas (tabla, modal, inputs); pantallas por
módulo con sus hooks de TanStack Query.

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
- **Nada de axios en componentes**: las llamadas van en `src/api/<dominio>_api.js`. Pantallas nuevas
  o que se tocan: datos con TanStack Query (`useQuery`/`useMutation`), **no** `useEffect` + fetch.
  (ESLint avisa `set-state-in-effect` en las que todavía lo hacen; vuelve a error cuando no quede ninguna.)
- Hooks siempre antes de cualquier `return`.
- Siempre los 3 estados: cargando, error (mensaje + reintentar), vacío.
- Formularios: React Hook Form + `zodResolver`.
- Reutilizar `components/` antes de crear algo nuevo; componentes de más de ~200 líneas → dividir.
- Accesible: `label` en inputs, `alt` en imágenes, botones reales, navegable con teclado.
- Fechas: zona `America/Argentina/Buenos_Aires` (el negocio funciona en hora argentina).

## Reglas Node.js (`servidor/`)

- Capas `routes → controllers → services`. El servicio tiene la lógica y es el único que usa modelos/SQL.
- `process.env` solo en `configuracion_servidor/env.js`.
- SQL crudo con `replacements`/`bind`. **Prohibido interpolar datos del usuario con `${}`**;
  nombres de columnas u orden solo desde una lista blanca. Búsquedas "contiene" escapando `%` y `_`.
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
