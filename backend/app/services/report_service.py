"""Caso de uso de Reportes: exportación CSV de incidentes (plan R3 de 007), de solo lectura.

Reutiliza la normalización de filtros y el orden de `IncidentService`; el formato vive en `domain/csv_report`.
"""

from datetime import datetime

from sqlmodel import Session

from app.domain import csv_report
from app.domain.csv_report import IncidentReportItem
from app.services.incident_service import IncidentListQuery, IncidentService, IncidentView


def _item(view: IncidentView) -> IncidentReportItem:
    incident = view.incident
    alert = view.alert
    return IncidentReportItem(
        incident_id=incident.id,
        alert_id=alert.alert.id,
        type_name=alert.type.name,
        severity=alert.alert.severity,
        zone_name=alert.zone.name,
        status=incident.status,
        team_name=view.team.name if view.team else None,
        escalated_to_name=view.escalated_to.name if view.escalated_to else None,
        opened_at=incident.opened_at,
        started_at=incident.started_at,
        resolved_at=incident.resolved_at,
        response_seconds=incident.response_seconds,
        resolution_seconds=incident.resolution_seconds,
        resolution_note=incident.resolution_note,
    )


class ReportService:
    def __init__(self, session: Session) -> None:
        self.incident_service = IncidentService(session)

    def incidents_csv(self, query: IncidentListQuery, now: datetime) -> tuple[str, str]:
        """(nombre del archivo, contenido CSV sin BOM) con los filtros de `/incidents`, máx. 5000 filas."""
        views = self.incident_service.list_all(query, csv_report.MAX_ROWS)
        content = csv_report.to_csv(csv_report.row_for(_item(v)) for v in views)
        return csv_report.report_filename(now), content
