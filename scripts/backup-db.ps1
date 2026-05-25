param(
  [string]$Tipo = "completo",
  [string]$Dir = ""
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($Dir)) {
  node scripts/backup-db.js --tipo=$Tipo
} else {
  node scripts/backup-db.js --tipo=$Tipo --dir=$Dir
}
