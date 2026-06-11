# pg_backup.ps1
# Dump completo de la base de datos PostgreSQL local.
# Genera un archivo .sql restaurable con pg_restore / psql.
#
# Uso:
#   cd servidor
#   .\scripts\pg_backup.ps1
#
# Requiere pg_dump en PATH (viene con la instalación de PostgreSQL).

$fecha      = Get-Date -Format "yyyyMMdd_HHmm"
$dirBackup  = Join-Path $PSScriptRoot "..\backups\$fecha"
$archivoSQL = Join-Path $dirBackup "dump_dynamicgym_$fecha.sql"

# Leer variables del .env local
$envFile = Join-Path $PSScriptRoot "../.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=]+?)\s*=\s*(.*?)\s*$') {
            $name  = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            if (-not [Environment]::GetEnvironmentVariable($name)) {
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "dynamicgym" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_PASS = if ($env:DB_PASS) { $env:DB_PASS } else { "" }

New-Item -ItemType Directory -Force -Path $dirBackup | Out-Null

Write-Host "🗄️  Dump de base de datos: $DB_NAME @ $DB_HOST`:$DB_PORT"
Write-Host "📁  Destino: $archivoSQL"
Write-Host ""

# pg_dump genera SQL plano restaurable con psql
$env:PGPASSWORD = $DB_PASS
pg_dump `
    --host=$DB_HOST `
    --port=$DB_PORT `
    --username=$DB_USER `
    --dbname=$DB_NAME `
    --no-owner `
    --no-acl `
    --file=$archivoSQL

if ($LASTEXITCODE -eq 0) {
    $tamano = [math]::Round((Get-Item $archivoSQL).Length / 1MB, 2)
    Write-Host "✅ Dump exitoso: $archivoSQL ($tamano MB)"
    Write-Host ""
    Write-Host "Para restaurar en otra base de datos:"
    Write-Host "   psql -U postgres -d nueva_base -f `"$archivoSQL`""
} else {
    Write-Host "❌ Error en pg_dump. Verificá que PostgreSQL esté en PATH y que las credenciales sean correctas."
    exit 1
}
