"""Casos de uso de la alerta: lista priorizada, detalle, acciones humanas y reporte manual (doc 05 §2)."""

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from sqlmodel import Session

from app.domain import alert_rules, state_machine
from app.domain.catalogs import DISMISS_REASON_LABELS, utcnow
from app.domain.enums import (
    AlertAction,
    AlertOrigin,
    AlertStatus,
    DismissReason,
    IncidentStatus,
    Severity,
    TimelineAction,
)
from app.domain.errors import NO_ENCONTRADO, TRANSICION_INVALIDA, VALIDACION, DomainError
from app.domain.models import Alert, AlertType, Incident, Source, TimelineEvent, User, Zone
from app.domain.scoring import ScoreBreakdown, compute_score
from app.repositories.alert_repo import AlertFilters, AlertRepository, AlertSort, AlertSortField
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.incident_repo import IncidentRepository
from app.repositories.timeline_repo import TimelineRepository
from app.repositories.transaction import begin_write

MANUAL_SOURCE_ID = "MANUAL"
ACTIVE_SHORTCUT = "activas"
DEFAULT_PAGE_SIZE = 20
_SORT_FIELDS: frozenset[str] = frozenset({"score", "detectedAt", "severity"})
_VALIDATION_MESSAGE = "Hay campos faltantes o inválidos."


# ---------- Entradas ----------


@dataclass(frozen=True)
class AlertListQuery:
    """Parámetros crudos de la lista; los valores desconocidos se ignoran al normalizar."""

    status: list[str] = field(default_factory=list)
    severity: list[str] = field(default_factory=list)
    zone: list[str] = field(default_factory=list)
    type: list[str] = field(default_factory=list)
    source: list[str] = field(default_factory=list)
    q: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    sort: str | None = None
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE


@dataclass(frozen=True)
class AlertCommand:
    action: AlertAction
    note: str | None = None
    reason: str | None = None
    comment: str | None = None


@dataclass(frozen=True)
class ManualAlertCommand:
    type_code: str
    zone_id: str
    severity: Severity
    description: str


# ---------- Vistas ----------


@dataclass(frozen=True)
class AlertView:
    alert: Alert
    type: AlertType
    zone: Zone
    source: Source
    incident_id: str | None


@dataclass(frozen=True)
class AlertPage:
    items: list[AlertView]
    total: int
    page: int
    page_size: int


@dataclass(frozen=True)
class TimelineEntryView:
    event: TimelineEvent
    actor: User | None
    payload: dict[str, Any] | None


@dataclass(frozen=True)
class AlertDetailView:
    summary: AlertView
    score_breakdown: ScoreBreakdown
    protocol: list[str]
    dismiss_reason_label: str | None
    reviewed_by: User | None
    reported_by: User | None
    incident: Incident | None
    timeline: list[TimelineEntryView]


@dataclass(frozen=True)
class AlertActionResult:
    alert: AlertDetailView
    incident: Incident | None


# ---------- Helpers puros ----------


def _split_valid(values: list[str], allowed: set[str]) -> list[str]:
    seen: list[str] = []
    for value in values:
        if value in allowed and value not in seen:
            seen.append(value)
    return seen


def _parse_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw.strip().replace(" ", "+"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=UTC)


def _parse_sort(raw: str | None) -> AlertSort:
    if not raw:
        return AlertSort()
    name, _, direction = raw.partition(":")
    if name not in _SORT_FIELDS or direction not in {"", "asc", "desc"}:
        return AlertSort()
    sort_field: AlertSortField = (
        "score" if name == "score" else "severity" if name == "severity" else "detectedAt"
    )
    return AlertSort(field=sort_field, descending=direction != "asc")


def _parse_statuses(values: list[str]) -> list[AlertStatus]:
    allowed = {s.value for s in AlertStatus}
    statuses: list[AlertStatus] = []
    for value in values:
        expanded = (
            [s.value for s in state_machine.ACTIVE_ALERT_STATUSES] if value == ACTIVE_SHORTCUT else [value]
        )
        for item in expanded:
            if item in allowed and AlertStatus(item) not in statuses:
                statuses.append(AlertStatus(item))
    # Sin estados válidos se aplica el valor por defecto: las activas.
    return statuses or [AlertStatus.NUEVA, AlertStatus.EN_REVISION]


def _iso(dt: datetime | None) -> str | None:
    return None if dt is None else dt.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _clean(text: str | None) -> str | None:
    if text is None:
        return None
    stripped = text.strip()
    return stripped or None


def _validation_error(fields: list[alert_rules.FieldError]) -> DomainError:
    return DomainError(VALIDACION, _VALIDATION_MESSAGE, {"fields": fields})


class AlertService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.alerts = AlertRepository(session)
        self.incidents = IncidentRepository(session)
        self.timeline = TimelineRepository(session)
        self.catalog = CatalogRepository(session)

    # ---------- Consultas ----------

    def list(self, query: AlertListQuery) -> AlertPage:
        zones = {z.id: z for z in self.catalog.list_zones()}
        types = {t.code: t for t in self.catalog.list_alert_types()}
        sources = {s.id: s for s in self.catalog.list_sources()}
        filters = AlertFilters(
            status=_parse_statuses(query.status),
            severity=[Severity(v) for v in _split_valid(query.severity, {s.value for s in Severity})],
            zone=_split_valid(query.zone, set(zones)),
            type=_split_valid(query.type, set(types)),
            source=_split_valid(query.source, set(sources)),
            q=_clean(query.q),
            date_from=_parse_datetime(query.date_from),
            date_to=_parse_datetime(query.date_to),
        )
        items, total = self.alerts.list(filters, _parse_sort(query.sort), query.page, query.page_size)
        incident_ids = self.incidents.ids_by_alerts([a.id for a in items])
        views = [
            AlertView(
                alert=a,
                type=types[a.type_code],
                zone=zones[a.zone_id],
                source=sources[a.source_id],
                incident_id=incident_ids.get(a.id),
            )
            for a in items
        ]
        return AlertPage(items=views, total=total, page=query.page, page_size=query.page_size)

    def get_detail(self, alert_id: str) -> AlertDetailView:
        alert = self._get_or_404(alert_id)
        alert_type = self.catalog.get_alert_type(alert.type_code)
        zone = self.catalog.get_zone(alert.zone_id)
        source = self.catalog.get_source(alert.source_id)
        if alert_type is None or zone is None or source is None:
            raise RuntimeError(f"Catálogo incompleto para la alerta {alert_id}")
        users = {u.id: u for u in self.catalog.list_users()}
        incident = self.incidents.get_by_alert(alert.id)
        reason_label = None
        if alert.dismiss_reason in {r.value for r in DismissReason}:
            reason_label = DISMISS_REASON_LABELS[DismissReason(alert.dismiss_reason)]["label"]
        timeline = [
            TimelineEntryView(
                event=e,
                actor=users.get(e.actor_id) if e.actor_id else None,
                payload=json.loads(e.payload_json) if e.payload_json else None,
            )
            for e in self.timeline.list_for_alert(alert.id)
        ]
        return AlertDetailView(
            summary=AlertView(
                alert=alert,
                type=alert_type,
                zone=zone,
                source=source,
                incident_id=incident.id if incident else None,
            ),
            score_breakdown=ScoreBreakdown.from_json(alert.score_breakdown_json),
            protocol=list(json.loads(alert_type.protocol_json)),
            dismiss_reason_label=reason_label,
            reviewed_by=users.get(alert.reviewed_by) if alert.reviewed_by else None,
            reported_by=users.get(alert.reported_by) if alert.reported_by else None,
            incident=incident,
            timeline=timeline,
        )

    # ---------- Escrituras ----------

    def apply_action(self, alert_id: str, command: AlertCommand, actor: User) -> AlertActionResult:
        """Aplica una acción humana en una sola transacción serializada (alerta + incidente + timeline)."""
        actor_id = actor.id
        begin_write(self.session)
        alert = self._get_or_404(alert_id)
        current = alert.status
        if not state_machine.can_apply(current, command.action):
            raise self._transition_error(alert)

        note = _clean(command.note)
        comment = _clean(command.comment)
        reason = _clean(command.reason)
        if command.action == AlertAction.CONFIRM:
            errors = alert_rules.validate_note(note)
        elif command.action == AlertAction.DISMISS:
            errors = alert_rules.validate_dismiss(reason, comment)
        elif command.action == AlertAction.COMMENT:
            errors = alert_rules.validate_comment(comment)
        else:
            errors = []
        if errors:
            raise _validation_error(errors)

        now = utcnow()
        if state_machine.needs_implicit_review(current, command.action):
            current = self._review(alert, actor_id, now)

        incident: Incident | None = None
        if command.action == AlertAction.REVIEW:
            self._review(alert, actor_id, now)
        elif command.action == AlertAction.CONFIRM:
            incident = self._confirm(alert, current, actor_id, note, now)
        elif command.action == AlertAction.DISMISS:
            assert reason is not None
            self._dismiss(alert, current, actor_id, DismissReason(reason), comment, now)
        else:
            state_machine.next_alert_status(current, AlertAction.COMMENT)
            self.timeline.add(
                TimelineEvent(
                    alert_id=alert.id,
                    actor_id=actor_id,
                    action=TimelineAction.COMMENT,
                    comment=comment,
                    created_at=now,
                )
            )
        self.session.commit()
        # La publicación de eventos SSE (alert.updated / incident.created) llega con la feature 003.
        incident_id = incident.id if incident is not None else None
        detail = self.get_detail(alert_id)
        return AlertActionResult(alert=detail, incident=detail.incident if incident_id else None)

    def report_manual(self, command: ManualAlertCommand, actor: User) -> AlertDetailView:
        """Crea una alerta de reporte humano (origin manual, fuente MANUAL, sin confianza)."""
        actor_id = actor.id
        begin_write(self.session)
        alert_type = self.catalog.get_alert_type(command.type_code)
        zone = self.catalog.get_zone(command.zone_id)
        description = _clean(command.description)
        errors: list[alert_rules.FieldError] = []
        if alert_type is None:
            errors.append({"field": "typeCode", "message": "El tipo de alerta no existe."})
        if zone is None:
            errors.append({"field": "zoneId", "message": "La zona no existe."})
        errors.extend(alert_rules.validate_description(description))
        if errors:
            raise _validation_error(errors)
        assert alert_type is not None and zone is not None and description is not None

        now = utcnow()
        breakdown = compute_score(command.severity, None, zone.criticality)
        alert = Alert(
            id=self.alerts.next_id(),
            type_code=alert_type.code,
            zone_id=zone.id,
            source_id=MANUAL_SOURCE_ID,
            severity=command.severity,
            status=AlertStatus.NUEVA,
            origin=AlertOrigin.MANUAL,
            detected_at=now,
            confidence=None,
            score=breakdown.score,
            score_breakdown_json=breakdown.to_json(),
            description=description,
            recommendation=alert_type.recommendation,
            evidence_key=alert_type.code,
            reported_by=actor_id,
        )
        self.alerts.add(alert)
        self.session.flush()  # la alerta debe existir antes de su evento (FK)
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                actor_id=actor_id,
                action=TimelineAction.CREATED,
                to_status=AlertStatus.NUEVA.value,
                created_at=now,
            )
        )
        alert_id = alert.id
        self.session.commit()
        # La publicación del evento SSE alert.created llega con la feature 003.
        return self.get_detail(alert_id)

    # ---------- Internos ----------

    def _get_or_404(self, alert_id: str) -> Alert:
        alert = self.alerts.get(alert_id)
        if alert is None:
            raise DomainError(NO_ENCONTRADO, f"La alerta {alert_id} no existe.")
        return alert

    def _transition_error(self, alert: Alert) -> DomainError:
        last = self.timeline.last_decision_for_alert(alert.id)
        last_actor = self.catalog.get_user(last.actor_id) if last and last.actor_id else None
        last_at = last.created_at if last else None
        message = state_machine.invalid_transition_message(
            alert.id, alert.status, last_actor.alias if last_actor else None, last_at
        )
        return DomainError(
            TRANSICION_INVALIDA,
            message,
            {
                "currentStatus": alert.status.value,
                "lastActor": {"id": last_actor.id, "alias": last_actor.alias} if last_actor else None,
                "lastActionAt": _iso(last_at),
            },
        )

    def _review(self, alert: Alert, actor_id: str, now: datetime) -> AlertStatus:
        from_status = alert.status
        to_status = state_machine.next_alert_status(from_status, AlertAction.REVIEW)
        alert.status = to_status
        alert.reviewed_by = actor_id
        alert.first_action_at = alert.first_action_at or now
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                actor_id=actor_id,
                action=TimelineAction.REVIEW,
                from_status=from_status.value,
                to_status=to_status.value,
                created_at=now,
            )
        )
        return to_status

    def _confirm(
        self, alert: Alert, current: AlertStatus, actor_id: str, note: str | None, now: datetime
    ) -> Incident:
        to_status = state_machine.next_alert_status(current, AlertAction.CONFIRM)
        alert.status = to_status
        alert.first_action_at = alert.first_action_at or now
        alert.closed_at = now
        incident = Incident(
            id=self.incidents.next_id(),
            alert_id=alert.id,
            status=IncidentStatus.ABIERTO,
            opened_by=actor_id,
            opened_at=now,
        )
        self.incidents.add(incident)
        self.session.flush()  # el incidente debe existir antes de sus eventos (FK)
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                actor_id=actor_id,
                action=TimelineAction.CONFIRM,
                from_status=current.value,
                to_status=to_status.value,
                comment=note,
                payload_json=json.dumps({"incidentId": incident.id}),
                created_at=now,
            )
        )
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                incident_id=incident.id,
                actor_id=actor_id,
                action=TimelineAction.INCIDENT_CREATED,
                to_status=IncidentStatus.ABIERTO.value,
                payload_json=json.dumps({"incidentId": incident.id}),
                created_at=now,
            )
        )
        return incident

    def _dismiss(
        self,
        alert: Alert,
        current: AlertStatus,
        actor_id: str,
        reason: DismissReason,
        comment: str | None,
        now: datetime,
    ) -> None:
        to_status = state_machine.next_alert_status(current, AlertAction.DISMISS)
        alert.status = to_status
        alert.dismiss_reason = reason.value
        alert.dismiss_comment = comment
        alert.first_action_at = alert.first_action_at or now
        alert.closed_at = now
        self.timeline.add(
            TimelineEvent(
                alert_id=alert.id,
                actor_id=actor_id,
                action=TimelineAction.DISMISS,
                from_status=current.value,
                to_status=to_status.value,
                comment=comment,
                payload_json=json.dumps({"reason": reason.value}),
                created_at=now,
            )
        )
