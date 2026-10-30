---
description: Levanta la demo de AeroSecure AI (backend :8000 + frontend :5173) y verifica que respondan
allowed-tools: Bash, PowerShell, Read
---
Usa el skill `demo-ops`.
1. Comprueba primero si ya está arriba: `powershell -File .claude/skills/demo-ops/scripts/health.ps1`.
2. Si no responde, ejecuta `./start-demo.ps1` **en segundo plano**. Si el script aún no existe (antes de la feature 001), indícalo y detente.
3. Vuelve a comprobar la salud cada pocos segundos (máximo unos 60 s) y reporta las URLs: http://localhost:5173 y http://localhost:8000/docs.
