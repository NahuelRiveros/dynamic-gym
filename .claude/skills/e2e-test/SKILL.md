---
name: e2e-test
description: Escribe tests de punta a punta con Playwright para flujos críticos (login, ingreso en el kiosco, registrar un pago, renovar un plan). Usar al cerrar una funcionalidad que el staff recorre completa.
argument-hint: <flujo, ej. "el staff registra el pago de un alumno vencido y el alumno entra por el kiosco">
---

# Test E2E: $ARGUMENTS

1. Archivo en `e2e/<flujo>.spec.js`. Ayudantes en `e2e/ayudantes.js` (`ingresar(page, usuario, destino)`).
2. Datos: los de `servidor/tests/armar_base.js` (`USUARIOS_TEST`, `ALUMNOS_TEST`). Si hace falta uno
   nuevo, agregarlo ahí (filas de prueba en la base local, nunca cambios de estructura).
   Un alumno por test si el flujo consume algo del día (el ingreso es uno por día).
3. Selectores: `getByRole`, `getByLabel`, `getByText`. Nada de clases CSS.
4. Sin `waitForTimeout`: `await expect(...).toBeVisible()`.
5. Verificar el efecto real (ej. después del pago, el alumno puede entrar por el kiosco).
6. Escritorio y celular; el kiosco solo en escritorio (`test.skip` con motivo).
7. `npm run test:e2e -- e2e/<flujo>.spec.js` y mostrar la salida; si falla, revisar el trace.

La base de los E2E es `dynamicgym_e2e_auto_test` (local, se rearma en cada corrida). Nunca Neon.
