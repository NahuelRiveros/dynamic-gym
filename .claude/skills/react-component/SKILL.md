---
name: react-component
description: Genera o rehace un componente o pantalla React (JavaScript + JSX, archivo snake_case) con Tailwind, sus datos con TanStack Query y su test con Testing Library + MSW. Usar para cualquier componente o pantalla nueva o que se reescribe.
argument-hint: <nombre_componente — dónde — descripción>
---

# Componente: $ARGUMENTS

1. Buscar en `frontend/src/components/` si ya existe algo reutilizable (form/, modal/, table/, ui/, feedback/).
2. Ubicación:
   - Genérico sin lógica de negocio → `src/components/ui/<nombre>.jsx`
   - Pantalla → `src/pages/<sección>/<nombre>_page.jsx`; sus partes, al lado o en `components/<sección>/`.
3. Datos del servidor:
   - `src/api/<dominio>_api.js`: funciones con `http` que devuelven `r.data`.
   - Hook con `useQuery` / `useMutation`; invalidar la lista al guardar. Nunca `useEffect` + fetch.
4. Componente:
   - Props desestructuradas con valores por defecto; hooks antes de cualquier `return`.
   - Estados: cargando, error (mensaje + reintentar), vacío, con datos.
   - Formularios: React Hook Form + Zod, error debajo de cada campo, botón deshabilitado mientras envía.
   - Mobile-first y accesible (`label`, botones reales, teclado).
5. Test `<nombre>.test.jsx`: `renderizar()` de `src/test/renderizar.jsx`, respuestas con `servidorMock.use(...)`
   (`src/test/servidor_mock.js`), sesión con `sesionComo({ roles })`. Buscar por rol o texto visible.
6. `npm run test:web -- <nombre>` y mostrar la salida.
