"""Acceso a `incidents`: alta, consulta, lista con JOIN a la alerta de origen y conteos (research R3)."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import ColumnElement, Integer, case, cast, func, or_
from sqlmodel import Session, col, select
from sqlmodel.sql.expression import Select

from app.domain.catalogs import SEVERITY_ORDER
from app.domain.enums import IncidentStatus, Severity
from app.domain.ids import INCIDENT_FIRST_NUMBER, INCIDENT_ID_PREFIX, format_incident_id
from app.domain.models import Alert, Incident
from app.domain.state_machine import IN_COURSE_INCIDENT_STATUSES
from app.domain.text import LIKE_ESCAPE, escape_like

IncidentSortField = Literal["openedAt", "severity", "responseSeconds"]


@dataclass(frozen=True)
class IncidentFilters:
    """Filtros ya normalizados; una lista vacía significa "sin filtro"."""

    status: list[IncidentStatus] = field(default_factory=list)
    severity: list[Severity] = field(default_factory=list)
    zone: list[str] = field(default_factory=list)
    type: list[str] = field(default_factory=list)
    q: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


@dataclass(frozen=True)
class IncidentSort:
    field: IncidentSortField = "openedAt"
    descending: bool = True


def _severity_order() -> ColumnElement[Any]:
    return case(
        *[(col(Alert.severity) == sev.value, order) for sev, order in SEVERITY_ORDER.items()],
        else_=0,
    )


def _filtered(filters: IncidentFilters) -> Select[tuple[Incident, Alert]]:
    stmt = select(Incident, Alert).join(Alert, col(Alert.id) == col(Incident.alert_id))
    if filters.status:
        stmt = stmt.where(col(Incident.status).in_([s.value for s in filters.status]))
    if filters.severity:
        stmt = stmt.where(col(Alert.severity).in_([s.value for s in filters.severity]))
    if filters.zone:
        stmt = stmt.where(col(Alert.zone_id).in_(filters.zone))
    if filters.type:
        stmt = stmt.where(col(Alert.type_code).in_(filters.type))
    if filters.q:
        like = f"%{escape_like(filters.q)}%"
        stmt = stmt.where(
            or_(
                col(Incident.id).ilike(like, escape=LIKE_ESCAPE),
                col(Alert.id).ilike(like, escape=LIKE_ESCAPE),
                col(Alert.description).ilike(like, escape=LIKE_ESCAPE),
            )
        )
    if filters.date_from is not None:
        stmt = stmt.where(col(Incident.opened_at) >= filters.date_from)
    if filters.date_to is not None:
        stmt = stmt.where(col(Incident.opened_at) <= filters.date_to)
    return stmt


def _order(sort: IncidentSort) -> list[Any]:
    order: list[Any] = []
    key: ColumnElement[Any]
    if sort.field == "severity":
        key = _severity_order()
    elif sort.field == "responseSeconds":
        key = col(Incident.response_seconds)
        order.append(col(Incident.response_seconds).is_(None))  # los nulos al final
    else:
        key = col(Incident.opened_at)
    order.append(key.desc() if sort.descending else key.asc())
    order.extend([col(Incident.opened_at).desc(), col(Incident.id).desc()])
    return order


# Modificador de SQLite para pasar una fecha UTC al día de Bogotá (UTC-5 fijo, plan R2 de 007).
BOGOTA_SQLITE_MODIFIER = "-5 hours"


def _bogota_day(column: Any) -> ColumnElement[Any]:
    """Día de Bogotá (`YYYY-MM-DD`) de una columna UTC: `date(datetime(col, '-5 hours'))`."""
    return func.date(func.datetime(column, BOGOTA_SQLITE_MODIFIER))


def _avg_or_none(value: Any) -> float | None:
    return None if value is None else float(value)


class IncidentRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def add(self, incident: Incident) -> Incident:
        self.session.add(incident)
        return incident

    def save(self, incident: Incident) -> Incident:
        self.session.add(incident)
        return incident

    def get(self, incident_id: str) -> Incident | None:
        return self.session.get(Incident, incident_id)

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

    def list_all(
        self, filters: IncidentFilters, sort: IncidentSort | None, max_rows: int
    ) -> list[tuple[Incident, Alert]]:
        """Los mismos filtros y orden que `list`, sin paginar y con un máximo de `max_rows` filas."""
        stmt = _filtered(filters).order_by(*_order(sort or IncidentSort())).limit(max_rows)
        return [(incident, alert) for incident, alert in self.session.exec(stmt).all()]

    def list(
        self, filters: IncidentFilters, sort: IncidentSort, page: int, page_size: int
    ) -> tuple[list[tuple[Incident, Alert]], int]:
        """Incidentes con su alerta de origen (JOIN), filtrados, ordenados y paginados, más el total."""
        stmt = _filtered(filters)
        total = int(self.session.exec(select(func.count()).select_from(stmt.subquery())).one())
        stmt = stmt.order_by(*_order(sort)).offset((page - 1) * page_size).limit(page_size)
        return [(incident, alert) for incident, alert in self.session.exec(stmt).all()], total

    def counts_in_course(self) -> int:
        """Incidentes en curso: abierto + en_atencion + escalado (doc 05 §6)."""
        stmt = (
            select(func.count())
            .select_from(Incident)
            .where(col(Incident.status).in_([s.value for s in IN_COURSE_INCIDENT_STATUSES]))
        )
        return int(self.session.exec(stmt).one())

    def count_opened_between(self, start: datetime, end: datetime) -> int:
        """Incidentes abiertos en [start, end), en cualquier estado."""
        stmt = (
            select(func.count())
            .select_from(Incident)
            .where(col(Incident.opened_at) >= start, col(Incident.opened_at) < end)
        )
        return int(self.session.exec(stmt).one())

    def count_resolved_between(self, start: datetime, end: datetime) -> int:
        """Incidentes resueltos en [start, end)."""
        stmt = (
            select(func.count())
            .select_from(Incident)
            .where(col(Incident.resolved_at) >= start, col(Incident.resolved_at) < end)
        )
        return int(self.session.exec(stmt).one())

    def avg_response_between(self, start: datetime, end: datetime) -> float | None:
        """Media de `response_seconds` de los incidentes abiertos en [start, end); None si no hay ninguno."""
        stmt = select(func.avg(col(Incident.response_seconds))).where(
            col(Incident.opened_at) >= start,
            col(Incident.opened_at) < end,
            col(Incident.response_seconds).is_not(None),
        )
        value = self.session.exec(stmt).one()
        return None if value is None else float(value)

    def counts_by_type_opened_since(self, since: datetime) -> dict[str, int]:
        """Incidentes abiertos desde `since` por tipo de su alerta de origen (JOIN a alerts)."""
        stmt = (
            select(col(Alert.type_code), func.count())
            .select_from(Incident)
            .join(Alert, col(Alert.id) == col(Incident.alert_id))
            .where(col(Incident.opened_at) >= since)
            .group_by(col(Alert.type_code))
        )
        return {type_code: int(count) for type_code, count in self.session.exec(stmt)}

    def counts_by_zone_opened_since(self, since: datetime) -> dict[str, int]:
        """Incidentes abiertos desde `since` por zona de su alerta de origen (JOIN a alerts)."""
        stmt = (
            select(col(Alert.zone_id), func.count())
            .select_from(Incident)
            .join(Alert, col(Alert.id) == col(Incident.alert_id))
            .where(col(Incident.opened_at) >= since)
            .group_by(col(Alert.zone_id))
        )
        return {zone_id: int(count) for zone_id, count in self.session.exec(stmt)}

    def daily_by_severity_since(self, since: datetime) -> dict[str, dict[str, int]]:
        """Día de Bogotá (`YYYY-MM-DD`) → severidad → incidentes abiertos desde `since`."""
        day = _bogota_day(col(Incident.opened_at))
        stmt = (
            select(day, col(Alert.severity), func.count())
            .select_from(Incident)
            .join(Alert, col(Alert.id) == col(Incident.alert_id))
            .where(col(Incident.opened_at) >= since)
            .group_by(day, col(Alert.severity))
        )
        result: dict[str, dict[str, int]] = {}
        for day_value, severity, count in self.session.exec(stmt):
            result.setdefault(str(day_value), {})[str(severity)] = int(count)
        return result

    def avg_times_since(self, since: datetime) -> tuple[float | None, float | None]:
        """(media de `response_seconds`, media de `resolution_seconds` de los resueltos) desde `since`.

        `func.avg` ignora los nulos: la resolución solo existe en los incidentes resueltos.
        """
        stmt = select(
            func.avg(col(Incident.response_seconds)), func.avg(col(Incident.resolution_seconds))
        ).where(col(Incident.opened_at) >= since)
        response, resolution = self.session.exec(stmt).one()
        return _avg_or_none(response), _avg_or_none(resolution)

    def daily_times_since(self, since: datetime) -> dict[str, tuple[float | None, float | None]]:
        """Día de Bogotá → (media de respuesta, media de resolución) de los incidentes abiertos ese día."""
        day = _bogota_day(col(Incident.opened_at))
        stmt = (
            select(day, func.avg(col(Incident.response_seconds)), func.avg(col(Incident.resolution_seconds)))
            .where(col(Incident.opened_at) >= since)
            .group_by(day)
        )
        return {
            str(day_value): (_avg_or_none(response), _avg_or_none(resolution))
            for day_value, response, resolution in self.session.exec(stmt)
        }
