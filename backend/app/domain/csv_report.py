"""Formato del reporte CSV de incidentes (contrato de 007, plan R3). Funciones puras, sin I/O."""

import csv
import io
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime

from app.domain.enums import IncidentStatus, Severity
from app.domain.time import to_bogota

HEADERS: tuple[str, ...] = (
    "ID incidente",
    "ID alerta",
    "Tipo",
    "Severidad",
    "Zona",
    "Estado",
    "Equipo",
    "Escalado a",
    "Abierto",
    "Inicio atención",
    "Resuelto",
    "T. respuesta (min)",
    "T. resolución (min)",
    "Nota de cierre",
)

SEVERITY_LABELS: dict[Severity, str] = {
    Severity.CRITICA: "Crítica",
    Severity.ALTA: "Alta",
    Severity.MEDIA: "Media",
    Severity.BAJA: "Baja",
}

INCIDENT_STATUS_LABELS: dict[IncidentStatus, str] = {
    IncidentStatus.ABIERTO: "Abierto",
    IncidentStatus.EN_ATENCION: "En atención",
    IncidentStatus.ESCALADO: "Escalado",
    IncidentStatus.RESUELTO: "Resuelto",
}

MAX_ROWS = 5000
FILENAME_PREFIX = "incidentes"


@dataclass(frozen=True)
class IncidentReportItem:
    """Datos de un incidente ya resueltos a nombres legibles (tipo, zona y equipos)."""

    incident_id: str
    alert_id: str
    type_name: str
    severity: Severity
    zone_name: str
    status: IncidentStatus
    team_name: str | None
    escalated_to_name: str | None
    opened_at: datetime
    started_at: datetime | None
    resolved_at: datetime | None
    response_seconds: int | None
    resolution_seconds: int | None
    resolution_note: str | None


def format_datetime(dt: datetime | None) -> str:
    """`YYYY-MM-DD HH:MM` en la hora de Bogotá; vacío si no hay fecha."""
    return "" if dt is None else to_bogota(dt).strftime("%Y-%m-%d %H:%M")


def format_minutes(seconds: int | None) -> str:
    """Minutos con 1 decimal y punto; vacío si no hay valor."""
    return "" if seconds is None else f"{seconds / 60:.1f}"


FORMULA_PREFIXES: tuple[str, ...] = ("=", "+", "-", "@")


def neutralize_formula(text: str) -> str:
    """Antepone un apóstrofo al texto que empieza por `=`, `+`, `-` o `@` (inyección de fórmulas en CSV)."""
    return f"'{text}" if text.startswith(FORMULA_PREFIXES) else text


def row_for(item: IncidentReportItem) -> list[str]:
    """Fila del CSV; los campos de texto se neutralizan (fechas y minutos se generan aquí y son seguros)."""
    return [
        neutralize_formula(item.incident_id),
        neutralize_formula(item.alert_id),
        neutralize_formula(item.type_name),
        SEVERITY_LABELS[item.severity],
        neutralize_formula(item.zone_name),
        INCIDENT_STATUS_LABELS[item.status],
        neutralize_formula(item.team_name or ""),
        neutralize_formula(item.escalated_to_name or ""),
        format_datetime(item.opened_at),
        format_datetime(item.started_at),
        format_datetime(item.resolved_at),
        format_minutes(item.response_seconds),
        format_minutes(item.resolution_seconds),
        neutralize_formula(item.resolution_note or ""),
    ]


def to_csv(rows: Iterable[Sequence[str]]) -> str:
    """Cabeceras + filas, separadas por comas y con comillas solo donde hace falta (sin BOM)."""
    buffer = io.StringIO()
    writer = csv.writer(buffer, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(HEADERS)
    writer.writerows(rows)
    return buffer.getvalue()


def report_filename(now: datetime) -> str:
    """`incidentes-YYYYMMDD-HHMM.csv` con la hora de Bogotá."""
    return f"{FILENAME_PREFIX}-{to_bogota(now).strftime('%Y%m%d-%H%M')}.csv"
