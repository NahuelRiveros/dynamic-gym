---
name: crud-admin
description: Arma o rehace una pantalla de administración completa (listado con búsqueda, filtros y paginación, formulario crear/editar, activar/desactivar con confirmación) sobre tablas que ya existen. Ej. planes, staff, productos.
argument-hint: <entidad, ej. "planes">
---

# Pantalla de administración: $ARGUMENTS

Solo sobre tablas existentes: la base no se modifica.

## Servidor (skill `api-endpoint` para cada endpoint que falte)
- Listado paginado (`pagina`, `limite` ≤ 100, `q`, filtros), detalle, crear, editar, activar/desactivar.
- Orden solo desde una lista blanca de columnas; búsqueda "contiene" escapando `%` y `_`.
- Admin para borrar o desactivar; staff según lo que ya permite hoy esa pantalla.

## Frontend
- Reutilizar `components/` (tabla, modal, confirmación, campos de formulario) antes de crear algo.
- `src/api/<dominio>_api.js` + hooks con TanStack Query (`useQuery` para listar, `useMutation` para
  guardar e invalidar la lista). Nada de `useEffect` + fetch.
- Búsqueda con debounce; filtros y página en la URL (`useSearchParams`).
- Un mismo formulario (React Hook Form + Zod) para crear y editar; errores del servidor en su campo.
- Confirmación antes de desactivar o borrar; estados cargando / error con reintentar / vacío.

## Tests
Servidor: todos los endpoints. Frontend (MSW): listado (render, búsqueda, vacío, error) y formulario
(validación + envío). E2E si es un flujo que el staff usa todos los días.
