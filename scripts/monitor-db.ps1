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

$cpuObj = Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor -Filter "Name='_Total'"
$cpu = [Math]::Round([double]$cpuObj.PercentProcessorTime, 2)

$os = Get-CimInstance Win32_OperatingSystem
$totalMemMb = [Math]::Round(($os.TotalVisibleMemorySize / 1024), 2)
$freeMemMb = [Math]::Round(($os.FreePhysicalMemory / 1024), 2)
$usedMemMb = [Math]::Round(($totalMemMb - $freeMemMb), 2)

$drive = Get-Location | Select-Object -ExpandProperty Path
$diskLetter = $drive.Substring(0,1)
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${diskLetter}:'"
$totalDiskGb = [Math]::Round(($disk.Size / 1GB), 2)
$freeDiskGb = [Math]::Round(($disk.FreeSpace / 1GB), 2)
$usedDiskGb = [Math]::Round(($totalDiskGb - $freeDiskGb), 2)

$dbQuery = @"
SELECT
  (SELECT count(*) FROM pg_stat_activity) AS total_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
  (SELECT count(*) FROM pg_locks WHERE NOT granted) AS waiting_locks,
  (SELECT COALESCE(sum(deadlocks),0) FROM pg_stat_database WHERE datname = current_database()) AS deadlocks_total,
  (SELECT pg_size_pretty(pg_database_size(current_database()))) AS db_size,
  (SELECT count(*) FROM pg_stat_activity WHERE state <> 'idle' AND now() - query_start > interval '5 seconds') AS slow_queries_5s;
"@

$dbRaw = & psql -h $env:PGHOST -p $env:PGPORT -U $env:PGUSER -d $env:PGDATABASE -t -A -F "," -c $dbQuery
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo consultar metricas PostgreSQL"
}

$vals = ($dbRaw | Select-Object -First 1).Trim().Split(',')

$result = @{
  timestamp = (Get-Date).ToString("o")
  host = $env:COMPUTERNAME
  cpu_percent = $cpu
  memory = @{ total_mb = $totalMemMb; used_mb = $usedMemMb; free_mb = $freeMemMb }
  disk = @{ total_gb = $totalDiskGb; used_gb = $usedDiskGb; free_gb = $freeDiskGb }
  postgres = @{
    total_connections = [int]$vals[0]
    active_connections = [int]$vals[1]
    waiting_locks = [int]$vals[2]
    deadlocks_total = [int]$vals[3]
    db_size = $vals[4]
    slow_queries_over_5s = [int]$vals[5]
  }
}

$result | ConvertTo-Json -Depth 5
