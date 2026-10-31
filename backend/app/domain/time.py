"""Hora local de presentación (America/Bogota, UTC-5 sin horario de verano). Sin zoneinfo (research R5)."""

from datetime import UTC, datetime, timedelta, timezone

BOGOTA_TZ = timezone(timedelta(hours=-5), "America/Bogota")


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


def format_local_time(dt: datetime) -> str:
    """Formatea una fecha (UTC si no trae zona) como "HH:MM" en la hora de Bogotá."""
    return _aware(dt).astimezone(BOGOTA_TZ).strftime("%H:%M")


def to_bogota(dt: datetime) -> datetime:
    """La misma fecha expresada en la hora de Bogotá (UTC si no trae zona)."""
    return _aware(dt).astimezone(BOGOTA_TZ)


def bogota_day_start(now: datetime) -> datetime:
    """Las 00:00 de hoy en Bogotá, en UTC (inicio de la ventana "hoy", doc 05 §6)."""
    local = to_bogota(now)
    return local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(UTC)


def bogota_hour_start(now: datetime) -> datetime:
    """El inicio de la hora en curso en Bogotá, en UTC (el desfase es de horas enteras)."""
    local = to_bogota(now)
    return local.replace(minute=0, second=0, microsecond=0).astimezone(UTC)


def same_window_yesterday(now: datetime) -> tuple[datetime, datetime]:
    """Ventana comparable de ayer: de las 00:00 de ayer a la misma hora de ayer (UTC)."""
    start = bogota_day_start(now) - timedelta(days=1)
    return start, _aware(now).astimezone(UTC) - timedelta(days=1)
