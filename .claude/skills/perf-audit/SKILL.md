---
name: perf-audit
description: Audita rendimiento pensando en Neon (cobra por tiempo despierta) — consultas N+1, consultas repetidas, tareas periódicas, respuestas pesadas, renders de más y tamaño del bundle. Sin cambiar la estructura de la base. Usar cuando algo anda lento o para bajar el uso de Neon.
argument-hint: [pantalla, endpoint o servicio]
---

# Auditoría de rendimiento: $ARGUMENTS

La base no se modifica: nada de índices nuevos ni cambios de tablas. Si un índice ayudaría mucho,
se **propone** con la medición y decide el dueño.

## Base de datos (sobre la base LOCAL de test o una copia, nunca Neon)
1. `logging: console.log` en Sequelize local, recorrer el flujo y detectar N+1 (misma consulta en un bucle).
2. Consultas lentas: `EXPLAIN (ANALYZE, BUFFERS)` en local; buscar `Seq Scan` en tablas grandes.
3. Arreglos sin tocar la base: un JOIN/`include` en vez de N consultas, `attributes` explícitos,
   paginar listados, traer solo el rango de fechas necesario.

## Neon (que la base pueda dormirse)
- Tareas periódicas (`cron/`): ¿hace falta la frecuencia actual? ¿se puede saltear fuera del horario del gimnasio?
- `/api/health` y monitores externos: ¿consultan la base en cada llamada?
- Pool de conexiones (`database/sequelize.js`): conexiones mínimas abiertas.
- Caché: datos que casi no cambian (catálogos, planes, estado de suscripción) en memoria o con `staleTime`.

## Frontend
- `npm run build` y revisar tamaño de chunks; `React.lazy` por pantalla.
- TanStack Query con `staleTime` adecuado; evitar pedidos repetidos al volver a una pantalla.

## Salida
Hallazgos ordenados por impacto, con medición antes/después cuando se aplique una mejora.
