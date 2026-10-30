"""DTOs de salud y catálogos (specs/001-fundacion/contracts/api-catalogs.md)."""

from typing import Literal

from app.api.schemas.base import ApiModel
from app.domain.enums import DismissReason, RiskLevel, Role, Severity
from app.services.catalog_service import AlertTypeView, DismissReasonView, ZoneView
from app.services.health_service import HealthStatus


class SimulatorStatusOut(ApiModel):
    enabled: bool
    interval_seconds: int
    running: bool


class HealthOut(ApiModel):
    status: Literal["ok"]
    db: Literal["ok", "error"]
    version: str
    simulator: SimulatorStatusOut

    @classmethod
    def from_status(cls, health: HealthStatus) -> "HealthOut":
        return cls(
            status=health.status,
            db=health.db,
            version=health.version,
            simulator=SimulatorStatusOut.model_validate(health.simulator),
        )


class UserOut(ApiModel):
    id: str
    alias: str
    role: Role


class GeometryOut(ApiModel):
    x: float
    z: float
    w: float
    d: float
    h: float


class ZoneOut(ApiModel):
    id: str
    name: str
    terminal: str
    criticality: int
    restricted: bool
    geometry: GeometryOut
    risk_level: RiskLevel
    active_alerts: int

    @classmethod
    def from_view(cls, view: ZoneView) -> "ZoneOut":
        zone = view.zone
        return cls(
            id=zone.id,
            name=zone.name,
            terminal=zone.terminal,
            criticality=zone.criticality,
            restricted=zone.restricted,
            geometry=GeometryOut(x=zone.geom_x, z=zone.geom_z, w=zone.geom_w, d=zone.geom_d, h=zone.geom_h),
            risk_level=view.risk_level,
            active_alerts=view.active_alerts,
        )


class TeamOut(ApiModel):
    id: str
    name: str
    specialty: str
    specialized: bool


class AlertTypeOut(ApiModel):
    code: str
    name: str
    default_severity: Severity | None
    confidence_threshold: float | None
    scenario_weight: int
    recommendation: str
    protocol: list[str]

    @classmethod
    def from_view(cls, view: AlertTypeView) -> "AlertTypeOut":
        return cls.model_validate(view)


class DismissReasonOut(ApiModel):
    code: DismissReason
    label: str
    requires_text: bool | None = None

    @classmethod
    def from_view(cls, view: DismissReasonView) -> "DismissReasonOut":
        return cls(code=view.code, label=view.label, requires_text=True if view.requires_text else None)
