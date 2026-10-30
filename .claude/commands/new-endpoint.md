---
description: Crea un endpoint del backend de punta a punta respetando las capas (domain → repositories → services → api)
argument-hint: <recurso> <acción o descripción>
---
Solicitud: `$ARGUMENTS`

1. Carga los skills `fastapi-layered` y `aerosecure-domain`.
2. Localiza el endpoint en `docs/arquitectura-y-diseño/08-especificacion-api.md` (ruta, DTO, errores, evento SSE). Si no está documentado, **detente y pregunta**: la documentación manda.
3. Delega la implementación al agente `backend-engineer` con: el endpoint exacto, los DTOs del doc 08 §2, las reglas del doc 05 que aplican y los archivos por capa que se deben tocar.
4. Al terminar, valida con `curl` (cabecera `X-Actor-Id`) y `uv run ruff check .`. Sin tests.
