"""Plantilla de servicio (capa services). Orquesta: dominio → repositorio → timeline → commit → evento."""

from datetime import datetime, timezone

from sqlmodel import Session

from app.domain import state_machine
from app.domain.errors import DomainError
from app.domain.models import Alert, TimelineEvent, User
from app.repositories.alert_repo import AlertRepository
from app.repositories.timeline_repo import TimelineRepository
from app.services.ports import EventPublisher


class AlertService:
    def __init__(self, session: Session, publisher: EventPublisher) -> None:
        self.session = session
        self.publisher = publisher
        self.alerts = AlertRepository(session)
        self.timeline = TimelineRepository(session)

    def apply_action(self, alert_id: str, command: "AlertCommand", actor: User) -> Alert:
        alert = self.alerts.get(alert_id)
        if alert is None:
            raise DomainError("NO_ENCONTRADO", f"La alerta {alert_id} no existe.", status=404)

        from_status = alert.status
        to_status = state_machine.next_alert_status(alert.status, command.action)  # lanza TRANSICION_INVALIDA

        now = datetime.now(timezone.utc)
        alert.status = to_status
        alert.first_action_at = alert.first_action_at or now
        self.alerts.save(alert)
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                actor_id=actor.id,
                action=command.action,
                from_status=from_status,
                to_status=to_status,
                comment=command.comment,
                created_at=now,
            )
        )
        self.session.commit()  # alerta + timeline en una sola transacción

        self.publisher.publish("alert.updated", {"id": alert.id, "status": to_status, "actor": actor.id})
        return alert
