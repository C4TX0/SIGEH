param(
  [string]$BootstrapUser = 'postgres',
  [string]$BootstrapPassword = '',
  [string]$TablespaceRoot = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path .env)) {
  Write-Output 'Aviso: no se encontro .env; se continua con variables del entorno.'
} else {
  Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $name = $matches[1].Trim()
      $value = $matches[2].Trim()
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

if ([string]::IsNullOrWhiteSpace($TablespaceRoot)) {
  $TablespaceRoot = if ($env:TABLESPACE_ROOT) { $env:TABLESPACE_ROOT } else { Join-Path $root '.pg/tablespaces' }
}

$resolvedTablespaceRoot = (Resolve-Path -Path (New-Item -ItemType Directory -Path $TablespaceRoot -Force).FullName).Path
$tsDatos = Join-Path $resolvedTablespaceRoot 'ts_datos'
$tsIndex = Join-Path $resolvedTablespaceRoot 'ts_index'
$tsLogs = Join-Path $resolvedTablespaceRoot 'ts_logs'
$tsBackup = Join-Path $resolvedTablespaceRoot 'ts_backup'

foreach ($dir in @($tsDatos, $tsIndex, $tsLogs, $tsBackup)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$databaseSql = Join-Path $root 'database.sql'
if (-not (Test-Path $databaseSql)) {
  throw 'No se encontro database.sql en la raiz del proyecto'
}

$psqlArgs = @(
  '-U', $BootstrapUser,
  '-d', 'postgres',
  '-v', 'ON_ERROR_STOP=1',
  '-v', "ts_datos_path=$tsDatos",
  '-v', "ts_index_path=$tsIndex",
  '-v', "ts_logs_path=$tsLogs",
  '-v', "ts_backup_path=$tsBackup",
  '-f', $databaseSql
)

if (-not [string]::IsNullOrWhiteSpace($BootstrapPassword)) {
  $env:PGPASSWORD = $BootstrapPassword
}

& psql @psqlArgs
if ($LASTEXITCODE -ne 0) {
  throw 'El bootstrap de base de datos fallo'
}

Write-Output (@{
  ok = $true
  tablespace_root = $resolvedTablespaceRoot
  ts_datos_path = $tsDatos
  ts_index_path = $tsIndex
  ts_logs_path = $tsLogs
  ts_backup_path = $tsBackup
} | ConvertTo-Json -Depth 5)
