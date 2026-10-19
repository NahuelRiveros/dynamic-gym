# respaldo_neon.ps1
# Respaldo completo de la base de produccion (Neon) antes de migrar a Supabase.
# Solo LEE la base: pg_dump y un conteo de filas. No modifica nada.
#
# Uso (desde la raiz del proyecto):
#   powershell -ExecutionPolicy Bypass -File servidor\scripts\respaldo_neon.ps1
#
# La URL de Neon se pide al correrlo (no se muestra ni se guarda). Usar la conexion DIRECTA
# (host sin "-pooler"): pg_dump no anda bien a traves del pooler.
#
# Genera en servidor\backups\<fecha>\ (ignorado por git: *.dump y *.sql):
#   neon_<fecha>.dump      -> formato custom, para restaurar con pg_restore en Supabase
#   neon_<fecha>.sql       -> SQL plano, para leerlo o restaurar con psql
#   conteo_filas.txt       -> filas por tabla (todos los esquemas), para comparar despues de restaurar

$ErrorActionPreference = "Stop"

# Postgres instalado no esta en el PATH: se busca la version mas nueva en Program Files.
function Buscar-Herramienta($nombre) {
    $enPath = Get-Command $nombre -ErrorAction SilentlyContinue
    if ($enPath) { return $enPath.Source }
    $candidato = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\$nombre.exe" -ErrorAction SilentlyContinue |
        Sort-Object { [int]$_.Directory.Parent.Name } -Descending | Select-Object -First 1
    if (-not $candidato) { throw "No encontre $nombre. Instala PostgreSQL (incluye pg_dump y psql)." }
    return $candidato.FullName
}

$pgDump = Buscar-Herramienta "pg_dump"
$psql   = Buscar-Herramienta "psql"

$url = $env:NEON_URL_RESPALDO
if (-not $url) {
    $segura = Read-Host "Pega la URL de conexion de Neon (postgresql://...)" -AsSecureString
    $url = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($segura))
}
if ($url -notmatch '^postgres(ql)?://') { throw "La URL tiene que empezar con postgresql://" }
if ($url -match '-pooler\.') {
    Write-Host "Aviso: es la URL del pooler. Si falla, usa la conexion directa (sin '-pooler')." -ForegroundColor Yellow
}
if ($url -notmatch 'sslmode=') {
    $url += $(if ($url -match '\?') { "&" } else { "?" }) + "sslmode=require"
}

$fecha   = Get-Date -Format "yyyyMMdd_HHmm"
$destino = Join-Path $PSScriptRoot "..\backups\$fecha"
New-Item -ItemType Directory -Force -Path $destino | Out-Null
$destino = (Resolve-Path $destino).Path

$archivoDump  = Join-Path $destino "neon_$fecha.dump"
$archivoSql   = Join-Path $destino "neon_$fecha.sql"
$archivoConteo = Join-Path $destino "conteo_filas.txt"

Write-Host "Usando $(& $pgDump --version)"
Write-Host "Destino: $destino`n"

# --no-owner/--no-acl: los roles de Neon (neondb_owner, etc.) no existen en Supabase.
Write-Host "1/3 Respaldo en formato custom..."
& $pgDump --dbname=$url --format=custom --no-owner --no-acl --file=$archivoDump
if ($LASTEXITCODE -ne 0) { throw "Fallo pg_dump (formato custom)." }

Write-Host "2/3 Respaldo en SQL plano..."
& $pgDump --dbname=$url --format=plain --no-owner --no-acl --file=$archivoSql
if ($LASTEXITCODE -ne 0) { throw "Fallo pg_dump (SQL plano)." }

# Conteo exacto por tabla de todos los esquemas propios (gym_v3, public y kinetica, que usa otra app)
# para verificar la restauracion. Los de Supabase quedan afuera para comparar lo mismo en los dos lados.
Write-Host "3/3 Contando filas por tabla..."
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
& $psql --dbname=$url --no-psqlrc --quiet --command=$consultaConteo --output=$archivoConteo
if ($LASTEXITCODE -ne 0) { throw "Fallo el conteo de filas." }

# Leer el indice del .dump confirma que el archivo no quedo cortado.
& (Join-Path (Split-Path $pgDump) "pg_restore.exe") --list $archivoDump | Out-Null
if ($LASTEXITCODE -ne 0) { throw "El archivo .dump no se puede leer: repetir el respaldo." }

$url = $null
$tamDump = [math]::Round((Get-Item $archivoDump).Length / 1MB, 2)
$tamSql  = [math]::Round((Get-Item $archivoSql).Length / 1MB, 2)
Write-Host "`nRespaldo OK" -ForegroundColor Green
Write-Host "  $archivoDump ($tamDump MB)"
Write-Host "  $archivoSql ($tamSql MB)"
Write-Host "  $archivoConteo"
Write-Host "`nGuarda una copia fuera de la PC (tiene datos personales de los alumnos)."
