"""Consultas de los catálogos (usuarios, zonas, equipos y tipos de alerta)."""

from sqlmodel import Session, col, select

from app.domain.models import AlertType, Source, Team, User, Zone


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_users(self) -> list[User]:
        return list(self.session.exec(select(User).order_by(col(User.id))).all())

    def get_user(self, user_id: str) -> User | None:
        return self.session.get(User, user_id)

    def list_zones(self) -> list[Zone]:
        return list(self.session.exec(select(Zone).order_by(col(Zone.id))).all())

    def get_zone(self, zone_id: str) -> Zone | None:
        return self.session.get(Zone, zone_id)

    def list_sources(self) -> list[Source]:
        return list(self.session.exec(select(Source).order_by(col(Source.id))).all())

    def get_source(self, source_id: str) -> Source | None:
        return self.session.get(Source, source_id)

    def get_alert_type(self, code: str) -> AlertType | None:
        return self.session.get(AlertType, code)

    def list_teams(self) -> list[Team]:
        return list(self.session.exec(select(Team).order_by(col(Team.specialized), col(Team.id))).all())

    def list_alert_types(self) -> list[AlertType]:
        """Ordenados como el doc 05 §4.2: por peso en el simulador, con los manuales (peso 0) al final."""
        weight = col(AlertType.scenario_weight)
        stmt = select(AlertType).order_by(weight == 0, weight, col(AlertType.code))
        return list(self.session.exec(stmt).all())
