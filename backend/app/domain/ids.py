"""Formato de los IDs legibles (funciones puras, sin dependencias)."""

ALERT_ID_PREFIX = "ALT-"
ALERT_FIRST_NUMBER = 2001
INCIDENT_ID_PREFIX = "INC-"
INCIDENT_FIRST_NUMBER = 401


def format_alert_id(number: int) -> str:
    """`2001` → `ALT-2001`."""
    return f"{ALERT_ID_PREFIX}{number:04d}"


def format_incident_id(number: int) -> str:
    """`401` → `INC-0401`."""
    return f"{INCIDENT_ID_PREFIX}{number:04d}"
