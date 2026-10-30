"""Plantilla de router (capa api). Delgado: deps → servicio → DTO. Sin SQL ni reglas de negocio."""

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.deps import get_actor, get_publisher, get_session
from app.api.schemas.alerts import AlertActionIn, AlertDetailOut
from app.domain.models import User
from app.services.alert_service import AlertService
from app.services.ports import EventPublisher

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/{alert_id}/actions", response_model=AlertDetailOut, response_model_by_alias=True)
def apply_alert_action(
    alert_id: str,
    body: AlertActionIn,
    session: Session = Depends(get_session),
    actor: User = Depends(get_actor),
    publisher: EventPublisher = Depends(get_publisher),
) -> AlertDetailOut:
    service = AlertService(session, publisher)
    alert = service.apply_action(alert_id, body.to_command(), actor)
    return AlertDetailOut.from_domain(alert)
