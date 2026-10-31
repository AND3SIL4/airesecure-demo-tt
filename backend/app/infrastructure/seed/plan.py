"""Siembra en dos pasos (research R6 de 004): **planificar** registros relativos a "ahora" y
**materializarlos**.

- `PlannedAlert`: la alerta con su antigüedad (`detected_ago`), sus eventos y, si se confirmó, su
  `PlannedIncident`.
- `PlannedEvent`: evento de historia con su desfase respecto de la detección de la alerta.
- `materialize`: ordena las alertas por `detected_at` (→ `ALT-2001…`) y los incidentes por `opened_at`
  (→ `INC-0401…`), calcula el score e inserta con `session.add` (sin repositories).
"""

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Any

from sqlmodel import Session

from app.domain.enums import AlertOrigin, AlertStatus, IncidentStatus, Severity, TimelineAction
from app.domain.ids import ALERT_FIRST_NUMBER, INCIDENT_FIRST_NUMBER, format_alert_id, format_incident_id
from app.domain.models import Alert, AlertType, Incident, Source, TimelineEvent, Zone
from app.domain.scoring import compute_score
from app.infrastructure.seed.texts import render


class EventScope(StrEnum):
    """A qué registro pertenece el evento: la alerta, el incidente o ambos (`incident_created`)."""

    ALERT = "alert"
    INCIDENT = "incident"
    BOTH = "both"


@dataclass(frozen=True)
class PlannedEvent:
    action: TimelineAction
    offset: timedelta  # desde la detección de la alerta
    actor_id: str | None
    scope: EventScope = EventScope.ALERT
    from_status: str | None = None
    to_status: str | None = None
    comment: str | None = None
    payload: dict[str, Any] | None = None
    with_incident_id: bool = False  # añade `incidentId` al payload al materializar


@dataclass(frozen=True)
class PlannedIncident:
    status: IncidentStatus
    opened_by: str
    opened_offset: timedelta
    team_id: str | None = None
    escalated_to_id: str | None = None
    started_offset: timedelta | None = None
    escalated_offset: timedelta | None = None
    resolved_offset: timedelta | None = None
    resolution_note: str | None = None


@dataclass(frozen=True)
class PlannedAlert:
    type_code: str
    severity: Severity
    status: AlertStatus
    zone_id: str
    source_id: str
    confidence: float | None
    detected_ago: timedelta  # antigüedad respecto de "ahora"
    origin: AlertOrigin = AlertOrigin.SEED
    template: int = 0
    minutes: int = 5
    people: int = 0
    reported_by: str | None = None
    reviewed_by: str | None = None
    first_action_offset: timedelta | None = None
    closed_offset: timedelta | None = None
    dismiss_reason: str | None = None
    dismiss_comment: str | None = None
    events: list[PlannedEvent] = field(default_factory=list)
    incident: PlannedIncident | None = None


@dataclass(frozen=True)
class AlertBase:
    """Datos comunes de la alerta planificada (antes de decidir su ciclo de vida)."""

    type_code: str
    severity: Severity
    zone_id: str
    source_id: str
    confidence: float | None
    detected_ago: timedelta
    template: int = 0
    minutes: int = 5
    people: int = 0
    reported_by: str | None = None  # reporte manual: origin manual y actor del `created`


@dataclass(frozen=True)
class TeamStep:
    team_id: str
    team_name: str
    offset: timedelta


@dataclass(frozen=True)
class IncidentLifecycle:
    """Desfases (desde la detección) del ciclo de vida de una alerta confirmada y su incidente."""

    actor_id: str
    review: timedelta
    confirm: timedelta
    assign: TeamStep | None = None
    start: timedelta | None = None
    escalate: TeamStep | None = None
    escalate_reason: str | None = None
    resolve: timedelta | None = None
    resolution_note: str | None = None


def _created(base: AlertBase) -> PlannedEvent:
    return PlannedEvent(
        TimelineAction.CREATED, timedelta(0), base.reported_by, to_status=AlertStatus.NUEVA.value
    )


def _review(actor_id: str, offset: timedelta) -> PlannedEvent:
    return PlannedEvent(
        TimelineAction.REVIEW,
        offset,
        actor_id,
        from_status=AlertStatus.NUEVA.value,
        to_status=AlertStatus.EN_REVISION.value,
    )


def _alert_fields(base: AlertBase) -> dict[str, Any]:
    return {
        "type_code": base.type_code,
        "severity": base.severity,
        "zone_id": base.zone_id,
        "source_id": base.source_id,
        "confidence": base.confidence,
        "detected_ago": base.detected_ago,
        "origin": AlertOrigin.MANUAL if base.reported_by else AlertOrigin.SEED,
        "template": base.template,
        "minutes": base.minutes,
        "people": base.people,
        "reported_by": base.reported_by,
    }


def plan_pending(base: AlertBase, reviewer: str | None, review: timedelta | None) -> PlannedAlert:
    """Alerta activa: `nueva` (solo created) o `en_revision` (created → review)."""
    events = [_created(base)]
    if reviewer is not None and review is not None:
        events.append(_review(reviewer, review))
        return PlannedAlert(
            **_alert_fields(base),
            status=AlertStatus.EN_REVISION,
            reviewed_by=reviewer,
            first_action_offset=review,
            events=events,
        )
    return PlannedAlert(**_alert_fields(base), status=AlertStatus.NUEVA, events=events)


def plan_dismissed(
    base: AlertBase,
    actor_id: str,
    review: timedelta,
    dismiss: timedelta,
    reason: str,
    comment: str | None,
) -> PlannedAlert:
    """created → review → dismiss (con motivo)."""
    return PlannedAlert(
        **_alert_fields(base),
        status=AlertStatus.DESCARTADA,
        reviewed_by=actor_id,
        first_action_offset=review,
        closed_offset=dismiss,
        dismiss_reason=reason,
        dismiss_comment=comment,
        events=[
            _created(base),
            _review(actor_id, review),
            PlannedEvent(
                TimelineAction.DISMISS,
                dismiss,
                actor_id,
                from_status=AlertStatus.EN_REVISION.value,
                to_status=AlertStatus.DESCARTADA.value,
                comment=comment,
                payload={"reason": reason},
            ),
        ],
    )


def plan_confirmed(base: AlertBase, life: IncidentLifecycle) -> PlannedAlert:
    """created → review → confirm → incident_created → [assign] → [start] → [escalate] → [resolve]."""
    actor = life.actor_id
    events = [
        _created(base),
        _review(actor, life.review),
        PlannedEvent(
            TimelineAction.CONFIRM,
            life.confirm,
            actor,
            from_status=AlertStatus.EN_REVISION.value,
            to_status=AlertStatus.CONFIRMADA.value,
            with_incident_id=True,
        ),
        PlannedEvent(
            TimelineAction.INCIDENT_CREATED,
            life.confirm,
            actor,
            scope=EventScope.BOTH,
            to_status=IncidentStatus.ABIERTO.value,
            with_incident_id=True,
        ),
    ]
    status = IncidentStatus.ABIERTO
    team_id: str | None = None
    if life.assign is not None:
        team_id = life.assign.team_id
        events.append(
            PlannedEvent(
                TimelineAction.ASSIGN,
                life.assign.offset,
                actor,
                scope=EventScope.INCIDENT,
                payload={"teamId": team_id, "teamName": life.assign.team_name, "previousTeamId": None},
            )
        )
    if life.start is not None:
        events.append(_incident_transition(TimelineAction.START, life.start, actor, status,
                                           IncidentStatus.EN_ATENCION))  # fmt: skip
        status = IncidentStatus.EN_ATENCION
    if life.escalate is not None:
        team_id = life.escalate.team_id
        events.append(
            _incident_transition(
                TimelineAction.ESCALATE,
                life.escalate.offset,
                actor,
                status,
                IncidentStatus.ESCALADO,
                comment=life.escalate_reason,
                payload={"teamId": team_id, "teamName": life.escalate.team_name},
            )
        )
        status = IncidentStatus.ESCALADO
    if life.resolve is not None:
        events.append(
            _incident_transition(
                TimelineAction.RESOLVE,
                life.resolve,
                actor,
                status,
                IncidentStatus.RESUELTO,
                comment=life.resolution_note,
                payload={"resolutionSeconds": _seconds(life.resolve)},
            )
        )
        status = IncidentStatus.RESUELTO
    return PlannedAlert(
        **_alert_fields(base),
        status=AlertStatus.CONFIRMADA,
        reviewed_by=actor,
        first_action_offset=life.review,
        closed_offset=life.confirm,
        events=events,
        incident=PlannedIncident(
            status=status,
            opened_by=actor,
            opened_offset=life.confirm,
            team_id=team_id,
            escalated_to_id=life.escalate.team_id if life.escalate else None,
            started_offset=life.start,
            escalated_offset=life.escalate.offset if life.escalate else None,
            resolved_offset=life.resolve,
            resolution_note=life.resolution_note if life.resolve is not None else None,
        ),
    )


def _incident_transition(
    action: TimelineAction,
    offset: timedelta,
    actor_id: str,
    from_status: IncidentStatus,
    to_status: IncidentStatus,
    comment: str | None = None,
    payload: dict[str, Any] | None = None,
) -> PlannedEvent:
    return PlannedEvent(
        action,
        offset,
        actor_id,
        scope=EventScope.INCIDENT,
        from_status=from_status.value,
        to_status=to_status.value,
        comment=comment,
        payload=payload,
    )


def _seconds(delta: timedelta) -> int:
    return max(0, int(delta.total_seconds()))


def _at(base: datetime, offset: timedelta | None) -> datetime | None:
    return None if offset is None else base + offset


def materialize(session: Session, plans: list[PlannedAlert], now: datetime) -> int:
    """Inserta los planes con IDs en orden cronológico global y hace commit. Devuelve las alertas creadas."""
    alert_types: dict[str, AlertType] = {}
    zones: dict[str, Zone] = {}
    sources: dict[str, Source] = {}

    def lookup[T](cache: dict[str, T], model: type[T], key: str) -> T:
        if key not in cache:
            found = session.get(model, key)
            if found is None:
                raise RuntimeError(f"Catálogo incompleto para sembrar: {model.__name__} {key}")
            cache[key] = found
        return cache[key]

    ordered = sorted(enumerate(plans), key=lambda item: (now - item[1].detected_ago, item[0]))
    alerts: list[Alert] = []
    pending_incidents: list[tuple[datetime, int, PlannedAlert, Alert]] = []
    for number, (_, plan) in enumerate(ordered):
        alert_type = lookup(alert_types, AlertType, plan.type_code)
        zone = lookup(zones, Zone, plan.zone_id)
        source = lookup(sources, Source, plan.source_id)
        detected_at = now - plan.detected_ago
        breakdown = compute_score(plan.severity, plan.confidence, zone.criticality)
        alert = Alert(
            id=format_alert_id(ALERT_FIRST_NUMBER + number),
            type_code=plan.type_code,
            zone_id=plan.zone_id,
            source_id=plan.source_id,
            severity=plan.severity,
            status=plan.status,
            origin=plan.origin,
            detected_at=detected_at,
            confidence=plan.confidence,
            score=breakdown.score,
            score_breakdown_json=breakdown.to_json(),
            description=render(
                plan.type_code,
                plan.template,
                zona=zone.name,
                fuente=source.label,
                min=max(plan.minutes, 5),
                n=plan.people,
            ),
            recommendation=alert_type.recommendation,
            evidence_key=plan.type_code,
            reported_by=plan.reported_by,
            reviewed_by=plan.reviewed_by,
            first_action_at=_at(detected_at, plan.first_action_offset),
            closed_at=_at(detected_at, plan.closed_offset),
            dismiss_reason=plan.dismiss_reason,
            dismiss_comment=plan.dismiss_comment,
        )
        alerts.append(alert)
        if plan.incident is not None:
            pending_incidents.append((detected_at + plan.incident.opened_offset, number, plan, alert))

    incidents: list[Incident] = []
    incident_by_alert: dict[str, Incident] = {}
    for number, (opened_at, _, plan, alert) in enumerate(sorted(pending_incidents, key=lambda i: i[:2])):
        planned = plan.incident
        assert planned is not None
        detected_at = alert.detected_at
        resolved_at = _at(detected_at, planned.resolved_offset)
        incident = Incident(
            id=format_incident_id(INCIDENT_FIRST_NUMBER + number),
            alert_id=alert.id,
            status=planned.status,
            team_id=planned.team_id,
            escalated_to_id=planned.escalated_to_id,
            opened_by=planned.opened_by,
            opened_at=opened_at,
            started_at=_at(detected_at, planned.started_offset),
            escalated_at=_at(detected_at, planned.escalated_offset),
            resolved_at=resolved_at,
            resolution_note=planned.resolution_note,
            response_seconds=(
                _seconds(plan.first_action_offset) if plan.first_action_offset is not None else None
            ),
            resolution_seconds=(
                _seconds(planned.resolved_offset) if planned.resolved_offset is not None else None
            ),
        )
        incidents.append(incident)
        incident_by_alert[alert.id] = incident

    events: list[TimelineEvent] = []
    for alert, (_, plan) in zip(alerts, ordered, strict=True):
        incident = incident_by_alert.get(alert.id)
        for planned_event in plan.events:
            payload = dict(planned_event.payload) if planned_event.payload else {}
            if planned_event.with_incident_id and incident is not None:
                payload["incidentId"] = incident.id
            in_alert = planned_event.scope in {EventScope.ALERT, EventScope.BOTH}
            in_incident = planned_event.scope in {EventScope.INCIDENT, EventScope.BOTH}
            events.append(
                TimelineEvent(
                    alert_id=alert.id if in_alert else None,
                    incident_id=incident.id if in_incident and incident is not None else None,
                    actor_id=planned_event.actor_id,
                    action=planned_event.action,
                    from_status=planned_event.from_status,
                    to_status=planned_event.to_status,
                    comment=planned_event.comment,
                    payload_json=json.dumps(payload, ensure_ascii=False) if payload else None,
                    created_at=alert.detected_at + planned_event.offset,
                )
            )

    session.add_all(alerts)
    session.flush()  # las alertas deben existir antes que sus incidentes y eventos (FK)
    session.add_all(incidents)
    session.flush()
    events.sort(key=lambda e: e.created_at)
    session.add_all(events)
    session.commit()
    return len(alerts)
