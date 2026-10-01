---
name: dominio-gimnasio
description: Reglas de negocio del gimnasio — alumnos y sus estados, planes (membresías) con vigencia e ingresos, ingreso por DNI en el kiosco, pagos y renovaciones, suscripción del software. Usar al diseñar o modificar cualquier flujo de alumnos, planes, kiosco, pagos o estadísticas.
---

# Dominio: gimnasio

Antes de cambiar una regla, confirmar con el dueño: estas reglas las usa el gimnasio todos los días.
La base no se modifica (ver `CLAUDE.md`).

## Personas y alumnos
- `persona` (DNI único en `documento`, sin puntos) → `alumno` (1 a 1) y/o `usuario` (staff/admin).
- El DNI se normaliza quitando puntos y espacios antes de buscar (`30.111.222` = `30111222`).

## Estados del alumno (`alumno.estado_id`)
- `1` Habilitado: plan vigente con ingresos disponibles (o plan ilimitado vigente).
- `2` Restringido: sin plan vigente o sin ingresos.
- Los recalcula el cron (`cron/estado_alumno_cron.js` → `estado_alumno_auto_service.js`) y el propio
  ingreso. Cada cambio queda en `alumno_estado_log` con motivo y fuente.

## Planes (`plan_tipo`) y membresías (`membresia`)
- Cada pago crea una `membresia` con `fecha_inicio`, `fecha_fin`, `dias_totales` e `ingresos_disponibles`.
- **El plan nuevo siempre empieza hoy**, nunca después del fin del plan actual.
- `fecha_fin` es **inclusive**: el alumno entra hasta el final de ese día.
- `plan_tipo.ingresos = 0` significa **ilimitado**: no se descuentan ingresos.

## Ingreso por DNI (kiosco)
Orden de chequeos (`ingresos_service.js`), todo en una transacción con bloqueo de fila:
1. DNI válido (solo números) → `VALIDACION` (400).
2. Existe la persona → `NO_EXISTE` (404); es alumno → `NO_ES_ALUMNO` (404).
3. Plan vigente (`fecha_fin >= hoy`) → `PLAN_VENCIDO_O_INEXISTENTE` (409, queda restringido).
4. Con ingresos (salvo ilimitado) → `SIN_INGRESOS` (409, queda restringido).
5. Un solo ingreso por día y membresía → `YA_INGRESO_HOY` (409).
6. Registra el ingreso, descuenta uno y recalcula el estado (con 0 restantes queda restringido).
- "Hoy" es la fecha de **Argentina**, no la del servidor.
- El kiosco necesita sesión de staff o admin, y **sigue funcionando aunque la suscripción del
  software esté vencida** (`/ingresos` está en `RUTAS_SIEMPRE_LIBRES`).

## Suscripción del software
- Tablas en el esquema `public` (`software_suscripcion`, `software_pago`).
- Vencida: los GET y las rutas libres (`/auth`, `/suscripcion`, `/consulta`, `/health`, `/ingresos`,
  `/catalogos`) siguen andando; el resto de las altas responde 402 `SUSCRIPCION_VENCIDA`, salvo
  con sesión iniciada.
- El estado se guarda 5 minutos en memoria (menos consultas a Neon); al renovar, `invalidarCacheSuscripcion()`.

## Datos de prueba
`servidor/tests/armar_base.js`: `USUARIOS_TEST` (admin, staff) y `ALUMNOS_TEST` (con plan, vencido,
sin ingresos, kiosco). Usarlos en tests nuevos en vez de inventar otros.
