"""Plantilla de repositorio (capa repositories). Solo acceso a datos: consultas, filtros y paginación."""

from dataclasses import dataclass

from sqlmodel import Session, func, select

from app.domain.models import Alert


@dataclass
class AlertFilters:
    status: list[str] | None = None
    severity: list[str] | None = None
    zone: list[str] | None = None
    q: str | None = None


class AlertRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, alert_id: str) -> Alert | None:
        return self.session.get(Alert, alert_id)

    def save(self, alert: Alert) -> Alert:
        self.session.add(alert)
        return alert

    def list(self, filters: AlertFilters, page: int, page_size: int) -> tuple[list[Alert], int]:
        stmt = select(Alert)
        if filters.status:
            stmt = stmt.where(Alert.status.in_(filters.status))
        if filters.severity:
            stmt = stmt.where(Alert.severity.in_(filters.severity))
        if filters.zone:
            stmt = stmt.where(Alert.zone_id.in_(filters.zone))
        if filters.q:
            like = f"%{filters.q}%"
            stmt = stmt.where(Alert.id.ilike(like) | Alert.description.ilike(like))
        total = self.session.exec(select(func.count()).select_from(stmt.subquery())).one()
        items = self.session.exec(
            stmt.order_by(Alert.score.desc(), Alert.detected_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return list(items), total
