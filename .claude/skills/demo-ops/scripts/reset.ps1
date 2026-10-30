# Reinicia los datos de la demo (requiere feature 008)
$headers = @{ 'X-Actor-Id' = 'sup-a' }
$res = Invoke-RestMethod -Method Post -Uri 'http://localhost:8000/api/demo/reset' -Headers $headers
$res | ConvertTo-Json -Compress
