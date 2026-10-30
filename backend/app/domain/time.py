"""Hora local de presentación (America/Bogota, UTC-5 sin horario de verano). Sin zoneinfo (research R5)."""

from datetime import UTC, datetime, timedelta, timezone

BOGOTA_TZ = timezone(timedelta(hours=-5), "America/Bogota")


def format_local_time(dt: datetime) -> str:
    """Formatea una fecha (UTC si no trae zona) como "HH:MM" en la hora de Bogotá."""
    aware = dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)
    return aware.astimezone(BOGOTA_TZ).strftime("%H:%M")
