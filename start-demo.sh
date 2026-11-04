#!/usr/bin/env bash
# AeroSecure AI - arranque de la demo en Linux/Ubuntu (backend :8000 + frontend :5173)
# Uso: ./start-demo.sh            (Ctrl+C detiene la API y la web)
# Variables opcionales:
#   WEB_HOST=0.0.0.0   interfaz de la web (por defecto accesible desde la red)
#   API_HOST=127.0.0.1 interfaz de la API (la web la usa por el proxy /api de Vite)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_PORT=8000
WEB_PORT=5173
WEB_HOST="${WEB_HOST:-0.0.0.0}"
API_HOST="${API_HOST:-127.0.0.1}"
LOG_DIR="$ROOT/.demo-logs"

step() { printf '\033[36m==> %s\033[0m\n' "$1"; }
fail() { printf '\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

# uv y bun se instalan en el home del usuario; los añadimos al PATH por si la shell no los cargó
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"

# 1. Herramientas requeridas
for tool in uv bun curl; do
  command -v "$tool" >/dev/null 2>&1 \
    || fail "No se encontró '$tool' en el PATH. Instálalo antes de continuar (ver README, sección Ubuntu)."
done

# 2. Puertos libres
for port in "$API_PORT" "$WEB_PORT"; do
  if ss -ltnH "sport = :$port" 2>/dev/null | grep -q .; then
    fail "El puerto $port ya está en uso. Cierra ese proceso o la instancia previa de la demo (ss -ltnp 'sport = :$port')."
  fi
done

# 3. Dependencias (solo si faltan)
if [ ! -d "$ROOT/backend/.venv" ]; then
  step 'Instalando dependencias del backend (uv sync)...'
  (cd "$ROOT/backend" && uv sync)
fi
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  step 'Instalando dependencias del frontend (bun install)...'
  (cd "$ROOT/frontend" && bun install)
fi

# 4. Lanzar procesos en segundo plano, cada uno en su propio grupo de procesos
mkdir -p "$LOG_DIR"
API_PID=''
WEB_PID=''

cleanup() {
  trap - INT TERM EXIT
  echo
  step 'Deteniendo la demo...'
  for pid in "$WEB_PID" "$API_PID"; do
    [ -n "$pid" ] && kill -TERM -- "-$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

step "Iniciando API en http://$API_HOST:$API_PORT ... (log: .demo-logs/api.log)"
(cd "$ROOT/backend" && exec setsid uv run uvicorn app.main:app --reload --host "$API_HOST" --port "$API_PORT") \
  >"$LOG_DIR/api.log" 2>&1 &
API_PID=$!

step "Iniciando web en http://$WEB_HOST:$WEB_PORT ... (log: .demo-logs/web.log)"
(cd "$ROOT/frontend" && exec setsid bun run dev --host "$WEB_HOST" --port "$WEB_PORT") \
  >"$LOG_DIR/web.log" 2>&1 &
WEB_PID=$!

# 5. Esperar a la API (máx. 60 s)
step 'Esperando a que la API responda...'
ready=false
for _ in $(seq 1 75); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$API_PORT/api/health" 2>/dev/null | grep -q '"ok"'; then
    ready=true; break
  fi
  kill -0 "$API_PID" 2>/dev/null || break
  sleep 0.8
done
if [ "$ready" != true ]; then
  printf '\033[33mLa API no respondió en 60 s. Últimas líneas de .demo-logs/api.log:\033[0m\n'
  tail -n 20 "$LOG_DIR/api.log" || true
  exit 1
fi

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo
printf '\033[32mAeroSecure AI está listo:\033[0m\n'
echo "  Web : http://localhost:$WEB_PORT"
[ "$WEB_HOST" = '0.0.0.0' ] && [ -n "$IP" ] && echo "  Red : http://$IP:$WEB_PORT"
echo "  API : http://localhost:$API_PORT/docs"
echo 'Pulsa Ctrl+C para detener la demo.'

# Mantener el script vivo mientras corran los procesos
wait -n "$API_PID" "$WEB_PID" || true
printf '\033[33mUno de los procesos terminó. Revisa .demo-logs/api.log y .demo-logs/web.log\033[0m\n'
