"""Acceso a `timeline_events` (solo inserción y lectura)."""

from sqlalchemy import or_
from sqlmodel import Session, col, select

from app.domain.enums import TimelineAction
from app.domain.models import TimelineEvent

_ALERT_DECISIONS = (TimelineAction.REVIEW, TimelineAction.CONFIRM, TimelineAction.DISMISS)
_INCIDENT_DECISIONS = (TimelineAction.START, TimelineAction.ESCALATE, TimelineAction.RESOLVE)


class TimelineRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, event: TimelineEvent) -> TimelineEvent:
        self.session.add(event)
        return event

    def list_for_alert(self, alert_id: str) -> list[TimelineEvent]:
        stmt = (
            select(TimelineEvent)
            .where(TimelineEvent.alert_id == alert_id)
            .order_by(col(TimelineEvent.created_at), col(TimelineEvent.id))
        )
        return list(self.session.exec(stmt).all())

    def last_decision_for_alert(self, alert_id: str) -> TimelineEvent | None:
        """La última decisión sobre la alerta (review, confirm o dismiss), sin eventos del incidente."""
        stmt = (
            select(TimelineEvent)
            .where(
                TimelineEvent.alert_id == alert_id,
                col(TimelineEvent.incident_id).is_(None),
                col(TimelineEvent.action).in_([a.value for a in _ALERT_DECISIONS]),
            )
            .order_by(col(TimelineEvent.created_at).desc(), col(TimelineEvent.id).desc())
            .limit(1)
        )
        return self.session.exec(stmt).first()

    def list_combined(self, alert_id: str, incident_id: str) -> list[TimelineEvent]:
        """Historia combinada: eventos de la alerta de origen **o** del incidente, sin duplicados
        (`incident_created` tiene ambos ids), en orden ascendente por (created_at, id)."""
        stmt = (
            select(TimelineEvent)
            .where(or_(TimelineEvent.alert_id == alert_id, TimelineEvent.incident_id == incident_id))
            .order_by(col(TimelineEvent.created_at), col(TimelineEvent.id))
        )
        return list(self.session.exec(stmt).all())

    def last_decision_for_incident(self, incident_id: str) -> TimelineEvent | None:
        """La última decisión sobre el incidente que cambió su estado (start, escalate o resolve)."""
        stmt = (
            select(TimelineEvent)
            .where(
                TimelineEvent.incident_id == incident_id,
                col(TimelineEvent.action).in_([a.value for a in _INCIDENT_DECISIONS]),
            )
            .order_by(col(TimelineEvent.created_at).desc(), col(TimelineEvent.id).desc())
            .limit(1)
        )
        return self.session.exec(stmt).first()
