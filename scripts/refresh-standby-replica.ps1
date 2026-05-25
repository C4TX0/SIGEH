param(
  [string]$PrimaryDb = "",
  [string]$StandbyDb = "",
  [switch]$UseLatestBackup,
  [string]$BackupFile = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

if ([string]::IsNullOrWhiteSpace($PrimaryDb)) {
  $PrimaryDb = if ($env:PGDATABASE) { $env:PGDATABASE } else { "sigeh_db" }
}
if ([string]::IsNullOrWhiteSpace($StandbyDb)) {
  $StandbyDb = if ($env:STANDBY_DB) { $env:STANDBY_DB } else { "sigeh_db_standby" }
}

if (-not $env:PGHOST -or -not $env:PGPORT -or -not $env:PGUSER -or -not $env:PGPASSWORD) {
  throw "Faltan variables PGHOST/PGPORT/PGUSER/PGPASSWORD en .env"
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$seedPath = Join-Path $root "backups/${PrimaryDb}_replica_seed_${stamp}.sql"
New-Item -ItemType Directory -Path (Join-Path $root "backups") -Force | Out-Null

if ($UseLatestBackup) {
  $latest = Get-ChildItem (Join-Path $root "backups/*.sql") | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($latest) {
    $seedPath = $latest.FullName
  } else {
    throw "No hay backups disponibles para usar -UseLatestBackup"
  }
} elseif (-not [string]::IsNullOrWhiteSpace($BackupFile)) {
  if (-not (Test-Path $BackupFile)) {
    throw "No existe el archivo de backup indicado: $BackupFile"
  }
  $seedPath = (Resolve-Path $BackupFile).Path
} else {
  $env:PGPASSWORD = $env:PGPASSWORD
  & pg_dump -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $PrimaryDb -F p --no-owner --no-privileges -f $seedPath
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump fallo al generar semilla de replica"
  }
}

& dropdb --if-exists -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER $StandbyDb
if ($LASTEXITCODE -ne 0) {
  throw "dropdb fallo para $StandbyDb"
}

& createdb -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER $StandbyDb
if ($LASTEXITCODE -ne 0) {
  throw "createdb fallo para $StandbyDb"
}

& psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $StandbyDb -v ON_ERROR_STOP=1 -f $seedPath
if ($LASTEXITCODE -ne 0) {
  throw "restore fallo para $StandbyDb"
}

$summary = @{
  ok = $true
  strategy = "standby_por_refresco_programado"
  primary_db = $PrimaryDb
  standby_db = $StandbyDb
  seed_file = $seedPath
  refreshed_at = (Get-Date).ToString("o")
}
$summary | ConvertTo-Json -Depth 5
