"""Acceso a `incidents` (en la feature 002 solo se crean y se consultan por alerta)."""

from sqlalchemy import Integer, cast, func
from sqlmodel import Session, col, select

from app.domain.ids import INCIDENT_FIRST_NUMBER, INCIDENT_ID_PREFIX, format_incident_id
from app.domain.models import Incident


class IncidentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, incident: Incident) -> Incident:
        self.session.add(incident)
        return incident

    def next_id(self) -> str:
        """Máximo numérico + 1, con mínimo INC-0401."""
        number = cast(func.substr(col(Incident.id), len(INCIDENT_ID_PREFIX) + 1), Integer)
        current = self.session.exec(select(func.max(number))).one()
        next_number = max(INCIDENT_FIRST_NUMBER, (current or 0) + 1)
        return format_incident_id(next_number)

    def get_by_alert(self, alert_id: str) -> Incident | None:
        return self.session.exec(select(Incident).where(Incident.alert_id == alert_id)).first()

    def ids_by_alerts(self, alert_ids: list[str]) -> dict[str, str]:
        """Mapa alert_id → incident_id de las alertas indicadas que tienen incidente."""
        if not alert_ids:
            return {}
        stmt = select(Incident.alert_id, Incident.id).where(col(Incident.alert_id).in_(alert_ids))
        return {alert_id: incident_id for alert_id, incident_id in self.session.exec(stmt).all()}
