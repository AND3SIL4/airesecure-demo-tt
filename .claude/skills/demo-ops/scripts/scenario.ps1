# Dispara un escenario predefinido (E-1..E-4)
param([Parameter(Mandatory = $true)][ValidateSet('E-1', 'E-2', 'E-3', 'E-4')][string]$Id)
$headers = @{ 'X-Actor-Id' = 'sup-a' }
$res = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/demo/scenarios/$Id/trigger" -Headers $headers
"Alerta creada: $($res.id) · $($res.type.name) · $($res.severity) · $($res.zone.name)"
