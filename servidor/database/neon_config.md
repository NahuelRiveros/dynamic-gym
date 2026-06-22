# Configuración Neon — Dynamic Gym

## Estado
- [x] Cuenta Neon creada
- [x] Proyecto creado en Neon (región: sa-east-1 São Paulo)
- [ ] Schemas importados (`gym_v3` + `public`)
- [ ] Variables de entorno actualizadas en Render
- [ ] .env local actualizado
- [ ] Verificación post-migración
- [ ] Migración completada (fecha: _________)

---

## URLs de conexión Neon

### App (Render env var) — usar esta en producción
```
postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

### Directa (para psql / pg_dump) — usar para importar el backup
```
postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta.sa-east-1.aws.neon.tech/neondb?sslmode=require
```
> ⚠️ Diferencia: la URL de app tiene `-pooler` en el host, la directa no.

---

## URL actual Render (guardar hasta migración completa)
```
postgresql://dynamic:vzKw71tIkeQcVyEpoZQF5d9mHUZUFTK6@dpg-d8bfq2l7vvec73eop720-a.oregon-postgres.render.com:5432/dynamicgym_yii5
```

---

## Diferencias clave Render → Neon

| Aspecto | Render (actual) | Neon (destino) |
|---------|----------------|----------------|
| Host | dpg-...oregon-postgres.render.com | ep-misty-mouse-ac71wbta-pooler.sa-east-1.aws.neon.tech |
| SSL | requerido | requerido |
| `search_path` | `-c search_path=gym_v3,public` | igual, no cambia |
| Schemas | `gym_v3` + `public` | igual |
| Max conexiones free | 25 | 100 (pooler serverless) |
| Expiración | ❌ 2026-06-26 | ✅ sin fecha de expiración |

---

## Paso 1 — Importar el backup en Neon ✅ LISTO PARA EJECUTAR

Backup disponible en: `servidor/backups/backup_render_20260619_124902.sql` (1.89 MB)

Ejecutar en PowerShell:
```powershell
$env:PGPASSWORD = "npg_xTgHOUzy5wv7"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  "postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta.sa-east-1.aws.neon.tech/neondb?sslmode=require" `
  -f "C:\Users\UPSTI-16\Desktop\proyectos\dynamic-gym\servidor\backups\backup_render_20260619_124902.sql"
```

**Verificar después de importar (conectarse con psql y ejecutar):**
```sql
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('gym_v3', 'public');
SELECT COUNT(*) FROM gym_v3.persona;
SELECT COUNT(*) FROM gym_v3.alumno;
SELECT COUNT(*) FROM gym_v3.membresia;
SELECT * FROM public.software_suscripcion;
```

---

## Paso 2 — Actualizar variables en Render (día de migración)

Dashboard Render → **dynamic-gym** (web service) → **Environment** → editar:

| Variable | Valor nuevo |
|----------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DB_SSL` | `true` (sin cambio) |

Render redespliega automáticamente (~30 seg). El código no cambia nada.

---

## Paso 3 — Actualizar .env local

En `servidor/.env`, reemplazar `DATABASE_URL`:
```env
# NEON — conexión directa para desarrollo local
DATABASE_URL=postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta.sa-east-1.aws.neon.tech/neondb?sslmode=require
DB_SSL=true
```

---

## Paso 4 — Verificación post-migración

- [ ] `GET https://dynamic-gym.onrender.com/api/health` → `{"ok":true}`
- [ ] Backend arranca sin errores (`✅ Base de datos conectada`)
- [ ] Cron inicia (`🟢 Cron de estados de alumnos iniciado`)
- [ ] Login de admin funciona
- [ ] Kiosk registra un ingreso de prueba
- [ ] Listado de alumnos carga correctamente
- [ ] Módulo super admin muestra estado de suscripción

---

## Plan de rollback

Si algo falla tras cambiar `DATABASE_URL` en Render:
1. Volver a la URL de Render en la variable de entorno (guardada arriba)
2. Render redespliega en ~30 segundos
3. Datos en Render intactos hasta fecha de gracia post-expiración

---

## Backup

| Archivo | Fecha | Tamaño |
|---------|-------|--------|
| `servidor/backups/backup_render_20260619_124902.sql` | 2026-06-19 | 1.89 MB |

Hacer un **backup nuevo** el día de la migración (26-06) para capturar datos del intervalo:
```powershell
$env:PGPASSWORD = "vzKw71tIkeQcVyEpoZQF5d9mHUZUFTK6"
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
  "postgresql://dynamic:vzKw71tIkeQcVyEpoZQF5d9mHUZUFTK6@dpg-d8bfq2l7vvec73eop720-a.oregon-postgres.render.com:5432/dynamicgym_yii5" `
  --no-password --format=plain --encoding=UTF8 --no-owner --no-acl `
  --file="C:\Users\UPSTI-16\Desktop\proyectos\dynamic-gym\servidor\backups\backup_render_MIGRACION_FINAL.sql"

$env:PGPASSWORD = "npg_xTgHOUzy5wv7"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  "postgresql://neondb_owner:npg_xTgHOUzy5wv7@ep-misty-mouse-ac71wbta.sa-east-1.aws.neon.tech/neondb?sslmode=require" `
  -f "C:\Users\UPSTI-16\Desktop\proyectos\dynamic-gym\servidor\backups\backup_render_MIGRACION_FINAL.sql"

```
