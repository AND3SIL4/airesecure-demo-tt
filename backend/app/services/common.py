"""Helpers puros compartidos por los casos de uso (normalización de consultas, textos y errores)."""

from datetime import UTC, datetime
from typing import Any

from app.domain.alert_rules import FieldError
from app.domain.errors import VALIDACION, DomainError

VALIDATION_MESSAGE = "Hay campos faltantes o inválidos."

# Evento en vivo pendiente de publicar tras el commit: (nombre, datos).
LiveEvent = tuple[str, dict[str, Any]]


def split_valid(values: list[str], allowed: set[str]) -> list[str]:
    """Conserva los valores permitidos, sin repetir y en su orden original."""
    seen: list[str] = []
    for value in values:
        if value in allowed and value not in seen:
            seen.append(value)
    return seen


def parse_datetime(raw: str | None) -> datetime | None:
    """ISO 8601 (un `+` convertido en espacio por la URL se recupera); sin zona se asume UTC."""
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.strip().replace(" ", "+"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def iso(dt: datetime | None) -> str | None:
    return None if dt is None else dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def clean(text: str | None) -> str | None:
    if text is None:
        return None
    stripped = text.strip()
    return stripped or None


def validation_error(fields: list[FieldError]) -> DomainError:
    return DomainError(VALIDACION, VALIDATION_MESSAGE, {"fields": fields})
