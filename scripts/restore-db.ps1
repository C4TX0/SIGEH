param(
  [Parameter(Mandatory = $true)]
  [string]$File,
  [string]$Db = ""
)

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($Db)) {
  node scripts/restore-db.js --file=$File
} else {
  node scripts/restore-db.js --file=$File --db=$Db
}
