"""Casos de uso de catálogos y resolución del actor (X-Actor-Id)."""

import json
from dataclasses import dataclass

from sqlmodel import Session

from app.domain.catalogs import DISMISS_REASON_LABELS
from app.domain.enums import DismissReason, RiskLevel, Role, Severity
from app.domain.errors import ACTOR_REQUERIDO, DomainError
from app.domain.models import Team, User, Zone
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.settings_repo import SettingsRepository


@dataclass(frozen=True)
class ZoneView:
    zone: Zone
    risk_level: RiskLevel
    active_alerts: int


@dataclass(frozen=True)
class AlertTypeView:
    code: str
    name: str
    default_severity: Severity | None
    confidence_threshold: float | None
    scenario_weight: int
    recommendation: str
    protocol: list[str]


@dataclass(frozen=True)
class DismissReasonView:
    code: DismissReason
    label: str
    requires_text: bool


class CatalogService:
    def __init__(self, session: Session) -> None:
        self.catalog = CatalogRepository(session)
        self.settings = SettingsRepository(session)

    def list_users(self) -> list[User]:
        return self.catalog.list_users()

    def list_teams(self) -> list[Team]:
        return self.catalog.list_teams()

    def list_zones(self) -> list[ZoneView]:
        # Punto de extensión (feature 002): riskLevel = severidad máxima de las alertas activas de la zona.
        return [
            ZoneView(zone=zone, risk_level=RiskLevel.NORMAL, active_alerts=0)
            for zone in self.catalog.list_zones()
        ]

    def list_alert_types(self) -> list[AlertTypeView]:
        settings = self.settings.get_all()
        views: list[AlertTypeView] = []
        for alert_type in self.catalog.list_alert_types():
            threshold = alert_type.confidence_threshold
            override = settings.get(f"thresholds.{alert_type.code}")
            if threshold is not None and override is not None:
                threshold = float(override)
            views.append(
                AlertTypeView(
                    code=alert_type.code,
                    name=alert_type.name,
                    default_severity=alert_type.default_severity,
                    confidence_threshold=threshold,
                    scenario_weight=alert_type.scenario_weight,
                    recommendation=alert_type.recommendation,
                    protocol=list(json.loads(alert_type.protocol_json)),
                )
            )
        return views

    def list_dismiss_reasons(self) -> list[DismissReasonView]:
        return [
            DismissReasonView(code=code, label=entry["label"], requires_text=entry["requires_text"])
            for code, entry in DISMISS_REASON_LABELS.items()
        ]

    def resolve_actor(self, actor_id: str | None) -> User:
        user = self.catalog.get_user(actor_id) if actor_id else None
        if user is None:
            raise DomainError(ACTOR_REQUERIDO, "Selecciona un perfil para continuar.")
        return user

    @staticmethod
    def is_supervisor(user: User) -> bool:
        return user.role == Role.SUPERVISOR
