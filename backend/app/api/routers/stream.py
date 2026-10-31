"""GET /stream: eventos en vivo por SSE (doc 08 §3.7, research R4 de 003).

No requiere `X-Actor-Id`: `EventSource` no admite cabeceras y los datos no son sensibles en la demo.
"""

import asyncio
import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.api.deps import EventBusDep
from app.infrastructure.event_bus import EventBus

router = APIRouter(tags=["stream"])

HEARTBEAT_SECONDS = 15.0
RETRY_MILLISECONDS = 3000
_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}


def _format(event: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=False, default=str)
    return f"event: {event}\ndata: {payload}\n\n"


def _now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


async def _event_stream(request: Request, bus: EventBus) -> AsyncIterator[str]:
    queue = bus.subscribe()
    try:
        yield f"retry: {RETRY_MILLISECONDS}\n\n"
        while True:
            if await request.is_disconnected():
                break
            try:
                message = await asyncio.wait_for(queue.get(), HEARTBEAT_SECONDS)
            except TimeoutError:
                yield _format("heartbeat", {"ts": _now_iso()})
                continue
            if message is None:  # el servidor se está apagando
                break
            event, data = message
            yield _format(event, data)
    finally:
        bus.unsubscribe(queue)


@router.get("/stream", response_class=StreamingResponse)
async def stream(request: Request, bus: EventBusDep) -> StreamingResponse:
    return StreamingResponse(_event_stream(request, bus), media_type="text/event-stream", headers=_HEADERS)
