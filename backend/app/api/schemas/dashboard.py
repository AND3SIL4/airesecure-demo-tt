"""DTOs del Resumen operativo (specs/005-resumen/contracts/api-dashboard.md, doc 08 §3.2)."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.api.schemas.alerts import AlertSummaryOut
from app.api.schemas.base import ApiModel
from app.domain.anomalies import Anomaly
from app.domain.enums import RiskLevel, Severity
from app.domain.metrics import Delta
from app.services.dashboard_service import DashboardSummary


class KpisOut(ApiModel):
    active_alerts: int
    critical_alerts: int
    open_incidents: int
    resolved_today: int
    avg_response_seconds_today: int | None


class DeltaOut(ApiModel):
    """`pct` solo aparece con `kind == "pct"` y `diff` solo con `kind == "abs"`."""

    value: int | float | None
    previous: int | float | None
    kind: Literal["pct", "abs", "none"]
    pct: float | None = None
    diff: int | float | None = None

    @classmethod
    def from_delta(cls, d: Delta) -> "DeltaOut":
        return cls(value=d.value, previous=d.previous, kind=d.kind, pct=d.pct, diff=d.diff)


class DeltasOut(ApiModel):
    active_alerts: DeltaOut
    critical_alerts: DeltaOut
    open_incidents: DeltaOut
    resolved_today: DeltaOut
    avg_response_seconds_today: DeltaOut


class ZoneStatusOut(ApiModel):
    id: str
    name: str
    risk_level: RiskLevel
    active_alerts: int


class AlertMarkerOut(ApiModel):
    id: str
    zone_id: str
    severity: Severity


class CategoryCountOut(ApiModel):
    type_code: str
    type_name: str
    count: int


class HourCountOut(ApiModel):
    hour: datetime
    count: int


class AnomalyOut(ApiModel):
    scope: Literal["zone", "type"]
    key: str
    label: str
    last_hour: int
    hourly_mean: float
    variation_pct: float

    @classmethod
    def from_anomaly(cls, a: Anomaly) -> "AnomalyOut":
        return cls(
            scope=a.scope,
            key=a.key,
            label=a.label,
            last_hour=a.last_hour,
            hourly_mean=a.hourly_mean,
            variation_pct=a.variation_pct,
        )


class DashboardSummaryOut(ApiModel):
    generated_at: datetime
    kpis: KpisOut
    deltas: DeltasOut
    top_alerts: list[AlertSummaryOut]
    zones: list[ZoneStatusOut]
    active_alert_markers: list[AlertMarkerOut]
    # Alias explícitos: `to_camel` produciría "byCategory7D" y "trend24H".
    by_category_7d: list[CategoryCountOut] = Field(alias="byCategory7d")
    trend_24h: list[HourCountOut] = Field(alias="trend24h")
    anomalies: list[AnomalyOut]

    @classmethod
    def from_summary(cls, s: DashboardSummary) -> "DashboardSummaryOut":
        k = s.kpis
        d = s.deltas
        return cls(
            generated_at=s.generated_at,
            kpis=KpisOut(
                active_alerts=k.active_alerts,
                critical_alerts=k.critical_alerts,
                open_incidents=k.open_incidents,
                resolved_today=k.resolved_today,
                avg_response_seconds_today=k.avg_response_seconds_today,
            ),
            deltas=DeltasOut(
                active_alerts=DeltaOut.from_delta(d.active_alerts),
                critical_alerts=DeltaOut.from_delta(d.critical_alerts),
                open_incidents=DeltaOut.from_delta(d.open_incidents),
                resolved_today=DeltaOut.from_delta(d.resolved_today),
                avg_response_seconds_today=DeltaOut.from_delta(d.avg_response_seconds_today),
            ),
            top_alerts=[AlertSummaryOut.from_view(v) for v in s.top_alerts],
            zones=[
                ZoneStatusOut(
                    id=z.zone.id, name=z.zone.name, risk_level=z.risk_level, active_alerts=z.active_alerts
                )
                for z in s.zones
            ],
            active_alert_markers=[
                AlertMarkerOut(id=m.id, zone_id=m.zone_id, severity=m.severity)
                for m in s.active_alert_markers
            ],
            by_category_7d=[
                CategoryCountOut(type_code=c.type_code, type_name=c.type_name, count=c.count)
                for c in s.by_category_7d
            ],
            trend_24h=[HourCountOut(hour=h.hour, count=h.count) for h in s.trend_24h],
            anomalies=[AnomalyOut.from_anomaly(a) for a in s.anomalies],
        )
