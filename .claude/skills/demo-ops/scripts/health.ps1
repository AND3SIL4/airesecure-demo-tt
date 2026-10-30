# Comprueba backend (/api/health) y frontend (:5173)
$ErrorActionPreference = 'SilentlyContinue'
$api = Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 3
if ($api) { Write-Output "Backend OK: $($api | ConvertTo-Json -Compress)" } else { Write-Output 'Backend NO responde en :8000' }
$web = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 3
if ($web.StatusCode -eq 200) { Write-Output 'Frontend OK en :5173' } else { Write-Output 'Frontend NO responde en :5173' }
