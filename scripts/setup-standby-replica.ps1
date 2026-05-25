param(
  [string]$PrimaryDb = "",
  [string]$StandbyDb = ""
)

$root = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot "refresh-standby-replica.ps1") -PrimaryDb $PrimaryDb -StandbyDb $StandbyDb
