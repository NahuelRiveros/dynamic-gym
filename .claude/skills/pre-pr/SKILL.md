---
name: pre-pr
description: Checklist de calidad antes de commitear o abrir un PR — lint, tests, reglas de CLAUDE.md sobre el diff (base de datos intocable incluida) y mensaje de commit. Usar antes de cada commit importante.
---

# Antes del commit / PR

1. Ejecutar y mostrar resultados reales: `npm run lint`, `npm test` y, si se tocó un flujo crítico, `npm run test:e2e`.
2. Revisar el diff (`git status` y `git diff`) contra `CLAUDE.md`:
   - **Base de datos**: cambios en `models_v2/`, `database/`, `sync(`, DDL. Si aparece alguno, frenar.
   - `console.log` de depuración, código comentado, archivos sin usar, archivos `.ts`/`.tsx`.
   - Lógica en controladores; axios en componentes; `useEffect` + fetch en pantallas nuevas.
   - Rutas sin `requireAuth`/`requireRole` o sin tests; `create(req.body)`; SQL con `${}` de datos del usuario.
   - Archivos que no van: `.env`, `.env.test`, `dist/`, dumps `.sql`, `test-results/`, `.exe`.
3. Si cambió la estructura o los comandos: `CLAUDE.md` actualizado en el mismo commit.
4. Proponer mensaje de commit en español (qué y por qué) y, si hay PR: qué, por qué, cómo probar, riesgos.
5. No commitear ni hacer push sin confirmación del usuario.
