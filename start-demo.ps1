# AeroSecure AI - arranque de la demo local (backend :8000 + frontend :5173)
# Uso: ./start-demo.ps1
# Usar Bypass: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$apiPort = 8000
$webPort = 5173

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }

# 1. Herramientas requeridas
foreach ($tool in 'uv', 'bun') {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "No se encontró '$tool' en el PATH. Instálalo antes de continuar (ver docs/arquitectura-y-diseño/06-arquitectura.md §4)." -ForegroundColor Red
        exit 1
    }
}

# 2. Puertos libres
foreach ($port in $apiPort, $webPort) {
    $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($busy) {
        $procId = ($busy | Select-Object -First 1).OwningProcess
        Write-Host "El puerto $port ya está en uso (PID $procId). Cierra ese proceso o la instancia previa de la demo." -ForegroundColor Red
        exit 1
    }
}

# 3. Dependencias (solo si faltan)
if (-not (Test-Path (Join-Path $root 'backend/.venv'))) {
    Write-Step 'Instalando dependencias del backend (uv sync)...'
    Push-Location (Join-Path $root 'backend'); uv sync; Pop-Location
}
if (-not (Test-Path (Join-Path $root 'frontend/node_modules'))) {
    Write-Step 'Instalando dependencias del frontend (bun install)...'
    Push-Location (Join-Path $root 'frontend'); bun install; Pop-Location
}

# 4. Lanzar procesos en ventanas propias
Write-Step "Iniciando API en http://localhost:$apiPort ..."
Start-Process powershell -WorkingDirectory (Join-Path $root 'backend') -ArgumentList @(
    '-NoExit', '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'AeroSecure AI - API :$apiPort'; uv run uvicorn app.main:app --reload --port $apiPort"
)
Write-Step "Iniciando web en http://localhost:$webPort ..."
Start-Process powershell -WorkingDirectory (Join-Path $root 'frontend') -ArgumentList @(
    '-NoExit', '-Command',
    "`$Host.UI.RawUI.WindowTitle = 'AeroSecure AI - Web :$webPort'; bun run dev"
)

# 5. Esperar a la API (máx. 60 s) y abrir el navegador
Write-Step 'Esperando a que la API responda...'
$deadline = (Get-Date).AddSeconds(60)
$ready = $false
while ((Get-Date) -lt $deadline) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$apiPort/api/health" -TimeoutSec 2
        if ($health.status -eq 'ok') { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 800
}
if (-not $ready) {
    Write-Host 'La API no respondió en 60 s. Revisa la ventana "AeroSecure AI - API".' -ForegroundColor Yellow
    exit 1
}

Start-Process "http://localhost:$webPort"
Write-Host ''
Write-Host 'AeroSecure AI está listo:' -ForegroundColor Green
Write-Host "  Web : http://localhost:$webPort"
Write-Host "  API : http://localhost:$apiPort/docs"
Write-Host 'Para detener la demo, cierra las ventanas "AeroSecure AI - API" y "AeroSecure AI - Web".'
