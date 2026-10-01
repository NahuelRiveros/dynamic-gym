---
name: feature
description: Orquesta una funcionalidad o mejora completa en fases servidor → frontend → E2E, con plan previo y verificación en cada fase, sin tocar la base de datos. Usar cuando algo cruza varias capas.
argument-hint: <descripción de la funcionalidad>
---

# Funcionalidad: $ARGUMENTS

## Fase 0 — Plan (todavía sin código)
1. Leer lo relacionado: servicios, rutas, pantallas y la skill `dominio-gimnasio`.
2. Presentar al usuario, en español simple:
   - Reglas de negocio entendidas + **preguntas abiertas** (planes, ingresos, pagos, permisos, casos raros).
   - Si necesitara un cambio en la base: decirlo y **no seguir** sin una decisión del dueño.
   - Endpoints (método, ruta, rol, entrada y salida) y pantallas, componentes y hooks.
   - Lista de archivos a crear o modificar.
3. Esperar confirmación.

## Fase 1 — Servidor
Skill `api-endpoint` por cada endpoint. Verificar: `npm run test:api`.

## Fase 2 — Frontend
Skills `react-component` / `crud-admin`. Verificar: `npm run test:web`.

## Fase 3 — E2E y cierre
- Flujos críticos (kiosco, pagos, login): skill `e2e-test`.
- Skill `pre-pr`.
- Resumen: qué se hizo, cómo probarlo a mano, decisiones tomadas, pendientes.

Si un test falla en una fase, se arregla antes de pasar a la siguiente.
