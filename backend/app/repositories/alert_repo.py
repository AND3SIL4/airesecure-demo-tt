"""Acceso a `alerts`: consultas con filtros, orden y paginación, generación de IDs y conteos por zona."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

from sqlalchemy import ColumnElement, Integer, case, cast, func, or_
from sqlmodel import Session, col, select

from app.domain.catalogs import SEVERITY_ORDER
from app.domain.enums import AlertStatus, Severity
from app.domain.ids import ALERT_FIRST_NUMBER, ALERT_ID_PREFIX, format_alert_id
from app.domain.models import Alert
from app.domain.state_machine import ACTIVE_ALERT_STATUSES
from app.domain.text import LIKE_ESCAPE, escape_like

AlertSortField = Literal["score", "detectedAt", "severity"]


@dataclass(frozen=True)
class AlertFilters:
    """Filtros ya normalizados (valores válidos); una lista vacía significa "sin filtro"."""

    status: list[AlertStatus] = field(default_factory=list)
    severity: list[Severity] = field(default_factory=list)
    zone: list[str] = field(default_factory=list)
    type: list[str] = field(default_factory=list)
    source: list[str] = field(default_factory=list)
    q: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


@dataclass(frozen=True)
class AlertSort:
    field: AlertSortField = "score"
    descending: bool = True


def _severity_order() -> ColumnElement[Any]:
    return case(
        *[(col(Alert.severity) == sev.value, order) for sev, order in SEVERITY_ORDER.items()],
        else_=0,
    )


class AlertRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, alert_id: str) -> Alert | None:
        return self.session.get(Alert, alert_id)

    def add(self, alert: Alert) -> Alert:
        self.session.add(alert)
        return alert

    def count(self) -> int:
        return int(self.session.exec(select(func.count()).select_from(Alert)).one())

    def next_id(self) -> str:
        """Máximo numérico + 1, con mínimo ALT-2001."""
        number = cast(func.substr(col(Alert.id), len(ALERT_ID_PREFIX) + 1), Integer)
        current = self.session.exec(select(func.max(number))).one()
        next_number = max(ALERT_FIRST_NUMBER, (current or 0) + 1)
        return format_alert_id(next_number)

    def list(
        self, filters: AlertFilters, sort: AlertSort, page: int, page_size: int
    ) -> tuple[list[Alert], int]:
        stmt = select(Alert)
        if filters.status:
            stmt = stmt.where(col(Alert.status).in_([s.value for s in filters.status]))
        if filters.severity:
            stmt = stmt.where(col(Alert.severity).in_([s.value for s in filters.severity]))
        if filters.zone:
            stmt = stmt.where(col(Alert.zone_id).in_(filters.zone))
        if filters.type:
            stmt = stmt.where(col(Alert.type_code).in_(filters.type))
        if filters.source:
            stmt = stmt.where(col(Alert.source_id).in_(filters.source))
        if filters.q:
            like = f"%{escape_like(filters.q)}%"
            stmt = stmt.where(
                or_(
                    col(Alert.id).ilike(like, escape=LIKE_ESCAPE),
                    col(Alert.description).ilike(like, escape=LIKE_ESCAPE),
                )
            )
        if filters.date_from is not None:
            stmt = stmt.where(col(Alert.detected_at) >= filters.date_from)
        if filters.date_to is not None:
            stmt = stmt.where(col(Alert.detected_at) <= filters.date_to)

        total = int(self.session.exec(select(func.count()).select_from(stmt.subquery())).one())

        key: ColumnElement[Any]
        if sort.field == "score":
            key = col(Alert.score)
        elif sort.field == "severity":
            key = _severity_order()
        else:
            key = col(Alert.detected_at)
        primary = key.desc() if sort.descending else key.asc()
        stmt = (
            stmt.order_by(primary, col(Alert.detected_at).desc(), col(Alert.id).desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(self.session.exec(stmt).all()), total

    def active_counts_by_zone(self) -> dict[str, tuple[int, int]]:
        """zone_id → (orden de la severidad máxima, número de alertas activas)."""
        stmt = (
            select(col(Alert.zone_id), func.max(_severity_order()), func.count())
            .where(col(Alert.status).in_([s.value for s in ACTIVE_ALERT_STATUSES]))
            .group_by(col(Alert.zone_id))
        )
        return {
            zone_id: (int(max_order), int(count)) for zone_id, max_order, count in self.session.exec(stmt)
        }
