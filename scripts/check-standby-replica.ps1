param(
  [string]$PrimaryDb = "",
  [string]$StandbyDb = ""
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

$query = @"
SELECT
  (SELECT count(*) FROM pacientes) AS pacientes,
  (SELECT count(*) FROM consultas) AS consultas,
  (SELECT count(*) FROM facturas) AS facturas,
  (SELECT max(fecha_creacion) FROM consultas) AS ultima_consulta;
"@

$primary = & psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $PrimaryDb -t -A -F "," -c $query
if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar base primaria" }

$standby = & psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $StandbyDb -t -A -F "," -c $query
if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar base standby" }

$p = ($primary | Select-Object -First 1).Trim().Split(',')
$s = ($standby | Select-Object -First 1).Trim().Split(',')

$result = @{
  strategy = "standby_por_refresco_programado"
  primary_db = $PrimaryDb
  standby_db = $StandbyDb
  primary = @{ pacientes=[int]$p[0]; consultas=[int]$p[1]; facturas=[int]$p[2]; ultima_consulta=$p[3] }
  standby = @{ pacientes=[int]$s[0]; consultas=[int]$s[1]; facturas=[int]$s[2]; ultima_consulta=$s[3] }
  deltas = @{ pacientes=([int]$p[0]-[int]$s[0]); consultas=([int]$p[1]-[int]$s[1]); facturas=([int]$p[2]-[int]$s[2]) }
  checked_at = (Get-Date).ToString("o")
}

$result | ConvertTo-Json -Depth 5
