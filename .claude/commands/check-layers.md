---
description: Ejecuta linters y tipos y detecta importaciones prohibidas entre capas (backend y frontend)
allowed-tools: Bash, PowerShell, Grep, Glob, Read
---
Ejecuta y resume (solo lectura; no corrijas nada salvo que el usuario lo pida):

1. Backend: `cd backend; uv run ruff check .`
2. Frontend: `cd frontend; bun run lint ; bunx tsc --noEmit`
3. Importaciones prohibidas (usa Grep):
   - `backend/app/domain/**`: no debe importar `app.api`, `app.services`, `app.repositories` ni `app.infrastructure`.
   - `backend/app/repositories/**`: no debe importar `app.services` ni `app.api`.
   - `backend/app/services/**`: no debe importar `fastapi` ni `app.api`.
   - `frontend/src/presentation/**`: no debe importar `infrastructure/` ni usar `fetch(` o `new EventSource`.
   - `frontend/src/domain/**`: no debe importar `../application`, `../infrastructure` ni `../presentation`.
4. Restricciones: no deben existir archivos `test_*.py`, `*.test.ts(x)` ni `*.spec.ts(x)`, y no debe haber dependencias fuera de la constitución en `backend/pyproject.toml` y `frontend/package.json`.

Salida: una tabla de resultados (✅ o ❌) y la lista de violaciones con `archivo:línea`. Para una revisión profunda, sugiere el agente `layer-guardian`.
