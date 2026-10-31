"""Puertos de la capa de servicios (doc 06 §2.1): la implementación vive en infrastructure."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol


class EventPublisher(Protocol):
    """Publica un evento en vivo (SSE). Se llama solo después de un commit exitoso."""

    def publish(self, event: str, data: dict[str, Any]) -> None: ...


class NullPublisher:
    """Publicador que no hace nada (consultas, siembra o usos sin tiempo real)."""

    def publish(self, event: str, data: dict[str, Any]) -> None:
        return None


@dataclass(frozen=True)
class ResetResult:
    """Conteos sembrados por el reinicio de la demo y su hora (UTC)."""

    alerts: int
    incidents: int
    reset_at: datetime


class DemoResetPort(Protocol):
    """Reinicia la demo (spec 008 R4): pausa el simulador, recrea el esquema, vuelve a sembrar, restaura la
    configuración del simulador, registra `demo_reset` con el actor y reanuda el simulador. No publica nada:
    el evento en vivo lo emite el servicio tras el commit."""

    async def reset(self, actor_id: str) -> ResetResult: ...
