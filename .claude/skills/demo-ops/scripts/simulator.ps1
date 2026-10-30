# Enciende/apaga el simulador y ajusta su intervalo (requiere feature 008)
param([Parameter(Mandatory = $true)][bool]$Enabled, [int]$Interval = 0)
$headers = @{ 'X-Actor-Id' = 'sup-a'; 'Content-Type' = 'application/json' }
$sim = @{ enabled = $Enabled }
if ($Interval -gt 0) { $sim.intervalSeconds = $Interval }
$body = @{ simulator = $sim } | ConvertTo-Json -Compress
Invoke-RestMethod -Method Put -Uri 'http://localhost:8000/api/settings' -Headers $headers -Body $body | ConvertTo-Json -Compress
