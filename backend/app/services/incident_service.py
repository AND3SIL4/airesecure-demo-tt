"""Casos de uso del incidente: registro, detalle con historial combinado y acciones (doc 05 §3).

Las escrituras van en una transacción serializada (`begin_write`), insertan su evento de historial y publican
`incident.updated` **después** del commit (research R5 de 004).
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from sqlmodel import Session

from app.domain import incident_rules, state_machine
from app.domain.catalogs import utcnow
from app.domain.enums import IncidentAction, IncidentStatus, Severity, TimelineAction
from app.domain.errors import NO_ENCONTRADO, TRANSICION_INVALIDA, DomainError
from app.domain.models import Alert, AlertType, Incident, Source, Team, TimelineEvent, User, Zone
from app.repositories.alert_repo import AlertRepository
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.incident_repo import (
    IncidentFilters,
    IncidentRepository,
    IncidentSort,
    IncidentSortField,
)
from app.repositories.timeline_repo import TimelineRepository
from app.repositories.transaction import begin_write
from app.services.alert_service import AlertView, TimelineEntryView
from app.services.common import LiveEvent, clean, iso, parse_datetime, split_valid, validation_error
from app.services.ports import EventPublisher, NullPublisher

IN_COURSE_SHORTCUT = "en_curso"
DEFAULT_PAGE_SIZE = 20
_SORT_FIELDS: dict[str, IncidentSortField] = {
    "openedAt": "openedAt",
    "severity": "severity",
    "responseSeconds": "responseSeconds",
}

# Nombre del evento en vivo (doc 08 §3.7).
EVENT_INCIDENT_UPDATED = "incident.updated"


# ---------- Entradas ----------


@dataclass(frozen=True)
class IncidentListQuery:
    """Parámetros crudos de la lista; los valores desconocidos se ignoran al normalizar."""

    status: list[str] = field(default_factory=list)
    severity: list[str] = field(default_factory=list)
    zone: list[str] = field(default_factory=list)
    type: list[str] = field(default_factory=list)
    q: str | None = None
    date_from: str | None = None
    date_to: str | None = None
    sort: str | None = None
    page: int = 1
    page_size: int = DEFAULT_PAGE_SIZE


@dataclass(frozen=True)
class IncidentCommand:
    action: IncidentAction
    team_id: str | None = None
    comment: str | None = None
    reason: str | None = None
    note: str | None = None


# ---------- Vistas ----------


@dataclass(frozen=True)
class IncidentView:
    incident: Incident
    alert: AlertView
    team: Team | None
    escalated_to: Team | None
    opened_by: User | None


@dataclass(frozen=True)
class IncidentPage:
    items: list[IncidentView]
    total: int
    page: int
    page_size: int


@dataclass(frozen=True)
class IncidentDetailView:
    summary: IncidentView
    timeline: list[TimelineEntryView]


@dataclass(frozen=True)
class _Catalogs:
    types: dict[str, AlertType]
    zones: dict[str, Zone]
    sources: dict[str, Source]
    teams: dict[str, Team]
    users: dict[str, User]


# ---------- Helpers puros ----------


def _parse_sort(raw: str | None) -> IncidentSort:
    if not raw:
        return IncidentSort()
    name, _, direction = raw.partition(":")
    sort_field = _SORT_FIELDS.get(name)
    if sort_field is None or direction not in {"", "asc", "desc"}:
        return IncidentSort()
    return IncidentSort(field=sort_field, descending=direction != "asc")


def _parse_statuses(values: list[str]) -> list[IncidentStatus]:
    """Estados válidos con el atajo `en_curso`; sin estados válidos no se filtra (por defecto, todos)."""
    allowed = {s.value for s in IncidentStatus}
    statuses: list[IncidentStatus] = []
    for value in values:
        expanded = (
            [s.value for s in IncidentStatus if state_machine.is_in_course(s)]
            if value == IN_COURSE_SHORTCUT
            else [value]
        )
        for item in expanded:
            if item in allowed and IncidentStatus(item) not in statuses:
                statuses.append(IncidentStatus(item))
    return statuses


def _seconds_between(start: datetime, end: datetime) -> int:
    return max(0, int((end - start).total_seconds()))


class IncidentService:
    def __init__(self, session: Session, publisher: EventPublisher | None = None) -> None:
        self.session = session
        self.publisher: EventPublisher = publisher if publisher is not None else NullPublisher()
        self.incidents = IncidentRepository(session)
        self.alerts = AlertRepository(session)
        self.timeline = TimelineRepository(session)
        self.catalog = CatalogRepository(session)

    # ---------- Consultas ----------

    def list_all(self, query: IncidentListQuery, max_rows: int) -> list[IncidentView]:
        """Los mismos filtros y orden que `list`, sin paginar (se ignoran `page` y `page_size`)."""
        catalogs = self._catalogs()
        rows = self.incidents.list_all(self._filters(query, catalogs), _parse_sort(query.sort), max_rows)
        return [self._view(incident, alert, catalogs) for incident, alert in rows]

    def list(self, query: IncidentListQuery) -> IncidentPage:
        catalogs = self._catalogs()
        filters = self._filters(query, catalogs)
        rows, total = self.incidents.list(filters, _parse_sort(query.sort), query.page, query.page_size)
        items = [self._view(incident, alert, catalogs) for incident, alert in rows]
        return IncidentPage(items=items, total=total, page=query.page, page_size=query.page_size)

    def count_in_course(self) -> int:
        return self.incidents.counts_in_course()

    def get_detail(self, incident_id: str) -> IncidentDetailView:
        incident = self._get_or_404(incident_id)
        alert = self.alerts.get(incident.alert_id)
        if alert is None:
            raise RuntimeError(f"El incidente {incident_id} no tiene alerta de origen")
        catalogs = self._catalogs()
        timeline = [
            TimelineEntryView(
                event=e,
                actor=catalogs.users.get(e.actor_id) if e.actor_id else None,
                payload=json.loads(e.payload_json) if e.payload_json else None,
            )
            for e in self.timeline.list_combined(alert.id, incident.id)
        ]
        return IncidentDetailView(summary=self._view(incident, alert, catalogs), timeline=timeline)

    # ---------- Escrituras ----------

    def apply_action(self, incident_id: str, command: IncidentCommand, actor: User) -> IncidentDetailView:
        """Aplica una acción humana en una sola transacción serializada (incidente + historial)."""
        actor_id = actor.id
        begin_write(self.session)
        incident = self._get_or_404(incident_id)
        current = incident.status
        if not state_machine.can_apply_incident(current, command.action):
            raise self._transition_error(incident, command.action)

        team_id = clean(command.team_id)
        team = self.catalog.get_team(team_id) if team_id else None
        comment = clean(command.comment)
        reason = clean(command.reason)
        note = clean(command.note)

        if command.action == IncidentAction.ASSIGN:
            errors = incident_rules.validate_assign(team is not None, comment)
        elif command.action == IncidentAction.ESCALATE:
            errors = incident_rules.validate_escalate(
                team is not None, team is not None and team.specialized, reason
            )
        elif command.action == IncidentAction.RESOLVE:
            errors = incident_rules.validate_resolve(note)
        elif command.action == IncidentAction.COMMENT:
            errors = incident_rules.validate_comment(comment)
        else:
            incident_rules.ensure_team_for_start(incident.team_id)
            errors = []
        if errors:
            raise validation_error(errors)

        to_status = state_machine.next_incident_status(current, command.action)
        now = utcnow()
        event = TimelineEvent(
            incident_id=incident.id,
            actor_id=actor_id,
            action=TimelineAction(command.action.value),
            created_at=now,
        )
        if to_status != current:
            event.from_status = current.value
            event.to_status = to_status.value

        if command.action == IncidentAction.ASSIGN:
            assert team is not None
            payload: dict[str, Any] = {
                "teamId": team.id,
                "teamName": team.name,
                "previousTeamId": incident.team_id,
            }
            incident.team_id = team.id
            event.comment = comment
            event.payload_json = json.dumps(payload, ensure_ascii=False)
        elif command.action == IncidentAction.START:
            incident.started_at = incident.started_at or now  # se conserva el primer inicio
        elif command.action == IncidentAction.ESCALATE:
            assert team is not None
            incident.team_id = team.id
            incident.escalated_to_id = team.id
            incident.escalated_at = now
            event.comment = reason
            event.payload_json = json.dumps({"teamId": team.id, "teamName": team.name}, ensure_ascii=False)
        elif command.action == IncidentAction.RESOLVE:
            alert = self.alerts.get(incident.alert_id)
            if alert is None:
                raise RuntimeError(f"El incidente {incident_id} no tiene alerta de origen")
            incident.resolved_at = now
            incident.resolution_note = note
            incident.resolution_seconds = _seconds_between(alert.detected_at, now)
            if incident.response_seconds is None and alert.first_action_at is not None:
                incident.response_seconds = _seconds_between(alert.detected_at, alert.first_action_at)
            event.comment = note
            event.payload_json = json.dumps({"resolutionSeconds": incident.resolution_seconds})
        else:
            event.comment = comment

        incident.status = to_status
        self.incidents.save(incident)
        self.timeline.add(event)
        events: list[LiveEvent] = [
            (EVENT_INCIDENT_UPDATED, {"id": incident_id, "status": to_status.value, "actorId": actor_id})
        ]
        self.session.commit()
        for name, data in events:
            self.publisher.publish(name, data)
        return self.get_detail(incident_id)

    # ---------- Internos ----------

    @staticmethod
    def _filters(query: IncidentListQuery, catalogs: _Catalogs) -> IncidentFilters:
        """Normaliza los parámetros crudos: los valores desconocidos se ignoran."""
        return IncidentFilters(
            status=_parse_statuses(query.status),
            severity=[Severity(v) for v in split_valid(query.severity, {s.value for s in Severity})],
            zone=split_valid(query.zone, set(catalogs.zones)),
            type=split_valid(query.type, set(catalogs.types)),
            q=clean(query.q),
            date_from=parse_datetime(query.date_from),
            date_to=parse_datetime(query.date_to),
        )

    def _catalogs(self) -> _Catalogs:
        return _Catalogs(
            types={t.code: t for t in self.catalog.list_alert_types()},
            zones={z.id: z for z in self.catalog.list_zones()},
            sources={s.id: s for s in self.catalog.list_sources()},
            teams={t.id: t for t in self.catalog.list_teams()},
            users={u.id: u for u in self.catalog.list_users()},
        )

    @staticmethod
    def _view(incident: Incident, alert: Alert, catalogs: _Catalogs) -> IncidentView:
        return IncidentView(
            incident=incident,
            alert=AlertView(
                alert=alert,
                type=catalogs.types[alert.type_code],
                zone=catalogs.zones[alert.zone_id],
                source=catalogs.sources[alert.source_id],
                incident_id=incident.id,
            ),
            team=catalogs.teams.get(incident.team_id) if incident.team_id else None,
            escalated_to=catalogs.teams.get(incident.escalated_to_id) if incident.escalated_to_id else None,
            opened_by=catalogs.users.get(incident.opened_by),
        )

    def _get_or_404(self, incident_id: str) -> Incident:
        incident = self.incidents.get(incident_id)
        if incident is None:
            raise DomainError(NO_ENCONTRADO, f"El incidente {incident_id} no existe.")
        return incident

    def _transition_error(self, incident: Incident, action: IncidentAction) -> DomainError:
        last = self.timeline.last_decision_for_incident(incident.id)
        last_actor = self.catalog.get_user(last.actor_id) if last and last.actor_id else None
        last_at = last.created_at if last else None
        message = state_machine.invalid_incident_transition_message(
            incident.id, incident.status, action, last_actor.alias if last_actor else None, last_at
        )
        return DomainError(
            TRANSICION_INVALIDA,
            message,
            {
                "currentStatus": incident.status.value,
                "lastActor": {"id": last_actor.id, "alias": last_actor.alias} if last_actor else None,
                "lastActionAt": iso(last_at),
            },
        )
