---
name: fastapi-layered
description: Receta para implementar funcionalidad del backend de AeroSecure AI respetando la arquitectura por capas (api → services → repositories → domain + infrastructure) con FastAPI, SQLModel, SQLite y SSE. Úsalo al crear o modificar endpoints, servicios, repositorios, modelos o eventos.
---

# Backend por capas (FastAPI)

Referencias: `docs/arquitectura-y-diseño/06-arquitectura.md` §2.1 y §3, `07-modelo-de-datos.md` y `08-especificacion-api.md`.

## Estructura
```
backend/app/
  main.py            # app, lifespan (crear DB, seed si falta, arrancar simulador), routers, handlers de errores, CORS
  config.py          # rutas, puerto, zona horaria de presentación
  api/
    deps.py          # get_session, get_actor (X-Actor-Id → User), require_supervisor
    errors.py        # DomainError → JSONResponse {error:{code,message,details}}
    schemas/         # DTOs Pydantic con alias camelCase (model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True))
    routers/         # un router por recurso: alerts, incidents, catalog, dashboard, analytics, reports, demo, settings, stream
  services/          # *_service.py: casos de uso; reciben Session y EventPublisher
  repositories/      # *_repo.py: consultas SQLModel, filtros, paginación, generación de IDs
  domain/            # models.py (tablas SQLModel), enums.py, state_machine.py, scoring.py, anomalies.py, errors.py
  infrastructure/    # db.py, event_bus.py, simulator.py, seed/
```

## Receta: nuevo endpoint de punta a punta
1. **domain**: si hay una regla nueva, se añade como una función pura (por ejemplo, en `state_machine.py`). Sin I/O.
2. **repositories**: un método con nombre explícito (`list_alerts(filters, page)`, `get_alert(id)`). Devuelve modelos de dominio. Sin reglas de negocio.
3. **services**: un método de caso de uso que:
   - abre una transacción (`with session.begin()` o un commit explícito);
   - valida con el dominio;
   - persiste;
   - inserta `TimelineEvent`;
   - hace commit;
   - **después** publica con `publisher.publish(event, data)`.
4. **api/schemas**: los DTOs de entrada y salida en camelCase, según el doc 08 §2.
5. **api/routers**: un handler delgado que recibe deps (`session`, `actor`), llama al servicio y mapea a DTO. Sin lógica.
6. Se registra el router en `main.py` con el prefijo `/api`.
7. `uv run ruff check . ; uv run ruff format .`, y probar con `curl -H "X-Actor-Id: op-01"`.

Plantillas: [templates/router.py](templates/router.py), [templates/service.py](templates/service.py), [templates/repository.py](templates/repository.py).

## SSE
- `infrastructure/event_bus.py`: `EventBus` con `subscribe() -> asyncio.Queue`, `unsubscribe(q)` y `publish(event, data)` (`put_nowait` a cada cola). Implementa el `Protocol` `EventPublisher` definido en `services/ports.py`.
- `api/routers/stream.py`: `StreamingResponse(media_type="text/event-stream")` que hace `yield f"event: {e}\ndata: {json}\n\n"` y envía un `heartbeat` cada 15 s. Al desconectar, hace `unsubscribe`.

## Errores
`raise DomainError(code="TRANSICION_INVALIDA", message="…", details={...}, status=409)`. El handler global produce el formato del doc 08 §1. No lances `HTTPException` desde `services`.

## Prohibido
SQL o `Session` en los routers; `fastapi` en `services`; reglas de negocio en `repositories`; tests; dependencias fuera de FastAPI, SQLModel, uvicorn y ruff.
