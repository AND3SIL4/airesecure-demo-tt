"""Puertos de la capa de servicios (doc 06 §2.1): la implementación vive en infrastructure."""

from typing import Any, Protocol


class EventPublisher(Protocol):
    """Publica un evento en vivo (SSE). Se llama solo después de un commit exitoso."""

    def publish(self, event: str, data: dict[str, Any]) -> None: ...


class NullPublisher:
    """Publicador que no hace nada (consultas, siembra o usos sin tiempo real)."""

    def publish(self, event: str, data: dict[str, Any]) -> None:
        return None
