---
name: demo-ops
description: Operación de la demo local de AeroSecure AI - arrancar backend y frontend, comprobar salud, reiniciar datos, disparar escenarios E-1..E-4, encender/apagar el simulador y diagnosticar problemas comunes. Úsalo cuando haya que levantar, preparar o verificar la demo.
---

# Operación de la demo

Referencia: `docs/arquitectura-y-diseño/11-guion-demo-y-aceptacion.md` (§1 preparación, §4 problemas).

| Acción | Cómo |
|---|---|
| Arrancar todo | `./start-demo.ps1` (en segundo plano). Backend: `cd backend; uv run uvicorn app.main:app --reload --port 8000`. Frontend: `cd frontend; bun run dev` |
| Salud | `powershell -File .claude/skills/demo-ops/scripts/health.ps1` (consulta `/api/health` y `:5173`) |
| Reiniciar datos | `powershell -File .claude/skills/demo-ops/scripts/reset.ps1` |
| Disparar un escenario | `powershell -File .claude/skills/demo-ops/scripts/scenario.ps1 -Id E-1` |
| Simulador | `powershell -File .claude/skills/demo-ops/scripts/simulator.ps1 -Enabled $false [-Interval 60]` |

Notas:
- Las acciones de la demo y la configuración requieren `X-Actor-Id: sup-a`.
- Para presentar: reiniciar los datos, apagar el simulador y entrar como Operador 01 (doc 11 §1).
- Los endpoints solo existen a partir de su feature (reset y settings en 008, escenarios en 003). Si devuelven 404, la feature aún no está implementada.
- Diagnóstico: un puerto ocupado se ve con `Get-NetTCPConnection -LocalPort 8000,5173`; si los datos parecen viejos, reiniciar; si el mapa aparece en 2D, falta WebGL en el navegador.
