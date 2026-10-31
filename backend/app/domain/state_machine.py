"""Máquinas de estados de la alerta (doc 05 §2) y del incidente (doc 05 §3). Funciones puras, sin I/O."""

from datetime import datetime

from app.domain.enums import AlertAction, AlertStatus, IncidentAction, IncidentStatus
from app.domain.errors import TRANSICION_INVALIDA, DomainError
from app.domain.time import format_local_time

ACTIVE_ALERT_STATUSES: frozenset[AlertStatus] = frozenset({AlertStatus.NUEVA, AlertStatus.EN_REVISION})

# Estados de origen permitidos por acción.
ALERT_ALLOWED_FROM: dict[AlertAction, frozenset[AlertStatus]] = {
    AlertAction.REVIEW: frozenset({AlertStatus.NUEVA}),
    AlertAction.CONFIRM: frozenset({AlertStatus.NUEVA, AlertStatus.EN_REVISION}),
    AlertAction.DISMISS: frozenset({AlertStatus.NUEVA, AlertStatus.EN_REVISION}),
    AlertAction.COMMENT: frozenset(AlertStatus),
}

# Estado de destino por acción (None = sin cambio).
_ALERT_TARGET: dict[AlertAction, AlertStatus | None] = {
    AlertAction.REVIEW: AlertStatus.EN_REVISION,
    AlertAction.CONFIRM: AlertStatus.CONFIRMADA,
    AlertAction.DISMISS: AlertStatus.DESCARTADA,
    AlertAction.COMMENT: None,
}

_FINAL_PARTICIPLE: dict[AlertStatus, str] = {
    AlertStatus.CONFIRMADA: "confirmada",
    AlertStatus.DESCARTADA: "descartada",
}


def can_apply(current: AlertStatus, action: AlertAction) -> bool:
    return current in ALERT_ALLOWED_FROM[action]


def next_alert_status(current: AlertStatus, action: AlertAction) -> AlertStatus:
    """Devuelve el estado resultante (comment → el mismo) o lanza TRANSICION_INVALIDA."""
    if not can_apply(current, action):
        raise DomainError(
            TRANSICION_INVALIDA,
            f"La acción '{action.value}' no está permitida sobre una alerta en estado '{current.value}'.",
            {"currentStatus": current.value},
        )
    target = _ALERT_TARGET[action]
    return current if target is None else target


def needs_implicit_review(current: AlertStatus, action: AlertAction) -> bool:
    """confirm o dismiss sobre una alerta nueva registran antes un review del mismo actor."""
    return current == AlertStatus.NUEVA and action in {AlertAction.CONFIRM, AlertAction.DISMISS}


def is_active(status: AlertStatus) -> bool:
    return status in ACTIVE_ALERT_STATUSES


def invalid_transition_message(
    alert_id: str,
    current: AlertStatus,
    last_actor_alias: str | None,
    last_action_at: datetime | None,
) -> str:
    """Mensaje legible del 409 según el estado actual de la alerta."""
    participle = _FINAL_PARTICIPLE.get(current)
    if participle is not None:
        who = last_actor_alias or "Sistema"
        when = f" a las {format_local_time(last_action_at)}" if last_action_at else ""
        return f"La alerta {alert_id} ya fue {participle} por {who}{when}."
    if current == AlertStatus.EN_REVISION:
        return f"La alerta {alert_id} ya está en revisión."
    return f"La acción no está permitida sobre la alerta {alert_id} en su estado actual."


# ---------- Incidente (doc 05 §3, research R1 de 004) ----------

IN_COURSE_INCIDENT_STATUSES: frozenset[IncidentStatus] = frozenset(
    {IncidentStatus.ABIERTO, IncidentStatus.EN_ATENCION, IncidentStatus.ESCALADO}
)

INCIDENT_ALLOWED_FROM: dict[IncidentAction, frozenset[IncidentStatus]] = {
    IncidentAction.ASSIGN: IN_COURSE_INCIDENT_STATUSES,
    IncidentAction.START: frozenset({IncidentStatus.ABIERTO, IncidentStatus.ESCALADO}),
    IncidentAction.ESCALATE: frozenset({IncidentStatus.ABIERTO, IncidentStatus.EN_ATENCION}),
    IncidentAction.RESOLVE: frozenset({IncidentStatus.EN_ATENCION, IncidentStatus.ESCALADO}),
    IncidentAction.COMMENT: frozenset(IncidentStatus),
}

_INCIDENT_TARGET: dict[IncidentAction, IncidentStatus | None] = {
    IncidentAction.ASSIGN: None,
    IncidentAction.START: IncidentStatus.EN_ATENCION,
    IncidentAction.ESCALATE: IncidentStatus.ESCALADO,
    IncidentAction.RESOLVE: IncidentStatus.RESUELTO,
    IncidentAction.COMMENT: None,
}

_INCIDENT_PARTICIPLE: dict[IncidentStatus, str] = {
    IncidentStatus.EN_ATENCION: "puesto en atención",
    IncidentStatus.ESCALADO: "escalado",
    IncidentStatus.RESUELTO: "resuelto",
}


def can_apply_incident(current: IncidentStatus, action: IncidentAction) -> bool:
    return current in INCIDENT_ALLOWED_FROM[action]


def next_incident_status(current: IncidentStatus, action: IncidentAction) -> IncidentStatus:
    """Estado resultante (assign y comment → el mismo) o TRANSICION_INVALIDA."""
    if not can_apply_incident(current, action):
        raise DomainError(
            TRANSICION_INVALIDA,
            f"La acción '{action.value}' no está permitida sobre un incidente en estado '{current.value}'.",
            {"currentStatus": current.value},
        )
    target = _INCIDENT_TARGET[action]
    return current if target is None else target


def is_in_course(status: IncidentStatus) -> bool:
    return status in IN_COURSE_INCIDENT_STATUSES


def invalid_incident_transition_message(
    incident_id: str,
    current: IncidentStatus,
    action: IncidentAction,
    last_actor_alias: str | None,
    last_action_at: datetime | None,
) -> str:
    """Mensaje legible del 409: "El incidente INC-xxxx ya fue {estado} por {alias} a las {HH:MM}."."""
    if current == IncidentStatus.ABIERTO and action == IncidentAction.RESOLVE:
        return f"El incidente {incident_id} está abierto: inicia la atención antes de resolverlo."
    participle = _INCIDENT_PARTICIPLE.get(current)
    if participle is not None:
        who = last_actor_alias or "Sistema"
        when = f" a las {format_local_time(last_action_at)}" if last_action_at else ""
        return f"El incidente {incident_id} ya fue {participle} por {who}{when}."
    return f"La acción no está permitida sobre el incidente {incident_id} en su estado actual."
