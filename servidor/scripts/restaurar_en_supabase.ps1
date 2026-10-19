# restaurar_en_supabase.ps1
# Restaura en Supabase el ultimo respaldo hecho con respaldo_neon.ps1 y compara las filas
# tabla por tabla con las de Neon.
#
# Uso (desde la raiz del proyecto):
#   powershell -ExecutionPolicy Bypass -File servidor\scripts\restaurar_en_supabase.ps1
#   (opcional) -Carpeta servidor\backups\20261019_1200   para elegir otro respaldo
#
# La URL de Supabase se pide al correrlo (no se muestra ni se guarda). Usar la del
# "Session pooler" (puerto 5432): la conexion directa de Supabase es solo IPv6.
# Se niega a restaurar sobre Neon o sobre una base que ya tenga el esquema gym_v3.

param([string]$Carpeta)

$ErrorActionPreference = "Stop"

function Buscar-Herramienta($nombre) {
    $enPath = Get-Command $nombre -ErrorAction SilentlyContinue
    if ($enPath) { return $enPath.Source }
    $candidato = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\$nombre.exe" -ErrorAction SilentlyContinue |
        Sort-Object { [int]$_.Directory.Parent.Name } -Descending | Select-Object -First 1
    if (-not $candidato) { throw "No encontre $nombre. Instala PostgreSQL (incluye pg_restore y psql)." }
    return $candidato.FullName
}

$pgRestore = Buscar-Herramienta "pg_restore"
$psql      = Buscar-Herramienta "psql"

if (-not $Carpeta) {
    $Carpeta = Get-ChildItem (Join-Path $PSScriptRoot "..\backups") -Directory -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
    if (-not $Carpeta) { throw "No hay respaldos. Primero corre servidor\scripts\respaldo_neon.ps1" }
}
$archivoDump = Get-ChildItem $Carpeta -Filter "neon_*.dump" | Select-Object -First 1 -ExpandProperty FullName
$conteoNeon  = Join-Path $Carpeta "conteo_filas.txt"
if (-not $archivoDump -or -not (Test-Path $conteoNeon)) { throw "En $Carpeta falta el .dump o conteo_filas.txt" }

$url = $env:SUPABASE_URL_PRUEBA
if (-not $url) {
    $segura = Read-Host "Pega la URL de Supabase (Session pooler, postgresql://...)" -AsSecureString
    $url = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))
}
if ($url -notmatch '^postgres(ql)?://') { throw "La URL tiene que empezar con postgresql://" }
if ($url -match 'neon\.tech') { throw "Esa URL es de Neon (produccion). Este script solo restaura en Supabase." }
if ($url -match ':6543') { throw "Es el Transaction pooler (6543). Usa el Session pooler (puerto 5432)." }
if ($url -notmatch 'sslmode=') {
    $url += $(if ($url -match '\?') { "&" } else { "?" }) + "sslmode=require"
}

# Restaurar sobre una base con datos mezclaria todo: solo se acepta una base sin gym_v3.
$existe = & $psql --dbname=$url --no-psqlrc --tuples-only --no-align `
    --command="SELECT count(*) FROM pg_namespace WHERE nspname = 'gym_v3'"
if ($LASTEXITCODE -ne 0) { throw "No me pude conectar a Supabase. Revisa la URL y la contrasena." }
if ($existe.Trim() -ne "0") {
    throw "Esa base ya tiene el esquema gym_v3. Usa un proyecto de Supabase vacio (o borralo vos a mano)."
}

Write-Host "Respaldo: $archivoDump"
Write-Host "Supabase: $(& $psql --dbname=$url --no-psqlrc --tuples-only --no-align --command='SHOW server_version')`n"

# Los errores de pg_restore se guardan para revisarlos: algunos son esperables en Supabase
# (por ejemplo "schema public already exists") y no frenan la restauracion.
$logErrores = Join-Path $Carpeta "restauracion_errores.txt"
Write-Host "1/2 Restaurando (puede tardar unos minutos)..."
# Con "Stop", PowerShell 5.1 cortaria en la primera linea que pg_restore escribe por stderr.
$ErrorActionPreference = "Continue"
& $pgRestore --dbname=$url --no-owner --no-acl --verbose $archivoDump 2> $logErrores
$codigoRestore = $LASTEXITCODE
$ErrorActionPreference = "Stop"

Write-Host "2/2 Comparando filas con Neon..."
$consultaConteo = @"
SELECT table_schema || '.' || table_name AS tabla,
       (xpath('/row/c/text()', query_to_xml(
          format('SELECT count(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS filas
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema', 'auth', 'extensions', 'graphql', 'graphql_public',
                           'realtime', 'storage', 'vault', 'pgbouncer', 'net', 'cron',
                           'supabase_functions', 'supabase_migrations')
ORDER BY 1;
"@
$conteoSupabase = Join-Path $Carpeta "conteo_filas_supabase.txt"
& $psql --dbname=$url --no-psqlrc --quiet --command=$consultaConteo --output=$conteoSupabase
if ($LASTEXITCODE -ne 0) { throw "Fallo el conteo de filas en Supabase." }
$url = $null

$diferencias = Compare-Object (Get-Content $conteoNeon) (Get-Content $conteoSupabase)
$errores = Select-String -Path $logErrores -Pattern "error:" | ForEach-Object { $_.Line }

Write-Host ""
if ($errores) {
    Write-Host "pg_restore informo $($errores.Count) error(es) (codigo $codigoRestore):" -ForegroundColor Yellow
    $errores | Select-Object -First 15 | ForEach-Object { Write-Host "  $_" }
    Write-Host "  Detalle completo: $logErrores"
}
if ($diferencias) {
    Write-Host "`nLas filas NO coinciden ('<=' Neon, '=>' Supabase):" -ForegroundColor Red
    $diferencias | ForEach-Object { Write-Host "  $($_.SideIndicator) $($_.InputObject)" }
    exit 1
}
Write-Host "Las filas de todas las tablas coinciden con Neon." -ForegroundColor Green
