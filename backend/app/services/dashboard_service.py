"""Caso de uso del Resumen operativo (GET /dashboard/summary), de solo lectura (research R5 de 005).

KPIs y variaciones (doc 05 §6), top 6 de alertas activas, estado de zonas, marcadores, incidentes por tipo
(7 días), tendencia de 24 h en hora de Bogotá y anomalías basadas en reglas (doc 05 §7).
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlmodel import Session

from app.domain import anomalies as anomaly_rules
from app.domain.anomalies import Anomaly
from app.domain.enums import Severity
from app.domain.metrics import Delta, delta
from app.domain.time import bogota_day_start, bogota_hour_start, same_window_yesterday, to_bogota
from app.repositories.alert_repo import AlertRepository
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.incident_repo import IncidentRepository
from app.services.alert_service import ACTIVE_SHORTCUT, AlertListQuery, AlertService, AlertView
from app.services.catalog_service import CatalogService, ZoneView

TOP_ALERTS = 6
TREND_HOURS = 24
CATEGORY_DAYS = 7
ANOMALY_RECENT_MINUTES = 60
ANOMALY_WINDOW_DAYS = 7


@dataclass(frozen=True)
class Kpis:
    active_alerts: int
    critical_alerts: int
    open_incidents: int
    resolved_today: int
    avg_response_seconds_today: int | None


@dataclass(frozen=True)
class KpiDeltas:
    active_alerts: Delta
    critical_alerts: Delta
    open_incidents: Delta
    resolved_today: Delta
    avg_response_seconds_today: Delta


@dataclass(frozen=True)
class AlertMarker:
    id: str
    zone_id: str
    severity: Severity


@dataclass(frozen=True)
class CategoryCount:
    type_code: str
    type_name: str
    count: int


@dataclass(frozen=True)
class HourCount:
    hour: datetime  # inicio de la hora, en hora de Bogotá (con zona -05:00)
    count: int


@dataclass(frozen=True)
class DashboardSummary:
    generated_at: datetime
    kpis: Kpis
    deltas: KpiDeltas
    top_alerts: list[AlertView]
    zones: list[ZoneView]
    active_alert_markers: list[AlertMarker]
    by_category_7d: list[CategoryCount]
    trend_24h: list[HourCount]
    anomalies: list[Anomaly]


def _round_or_none(value: float | None) -> int | None:
    return None if value is None else round(value)


class DashboardService:
    def __init__(self, session: Session) -> None:
        self.alerts = AlertRepository(session)
        self.incidents = IncidentRepository(session)
        self.catalog = CatalogRepository(session)
        self.alert_service = AlertService(session)
        self.catalog_service = CatalogService(session)

    def summary(self, now: datetime) -> DashboardSummary:
        top_page = self.alert_service.list(AlertListQuery(status=[ACTIVE_SHORTCUT], page_size=TOP_ALERTS))
        critical_total = self.alert_service.list(
            AlertListQuery(status=[ACTIVE_SHORTCUT], severity=[Severity.CRITICA.value], page_size=1)
        ).total

        today_start = bogota_day_start(now)
        avg_today = self.incidents.avg_response_between(today_start, now)
        kpis = Kpis(
            active_alerts=top_page.total,
            critical_alerts=critical_total,
            open_incidents=self.incidents.counts_in_course(),
            resolved_today=self.incidents.count_resolved_between(today_start, now),
            avg_response_seconds_today=_round_or_none(avg_today),
        )

        return DashboardSummary(
            generated_at=now,
            kpis=kpis,
            deltas=self._deltas(now, today_start, avg_today),
            top_alerts=top_page.items,
            zones=self.catalog_service.list_zones(),
            active_alert_markers=[
                AlertMarker(id=alert_id, zone_id=zone_id, severity=severity)
                for alert_id, zone_id, severity in self.alerts.active_markers()
            ],
            by_category_7d=self._by_category(now),
            trend_24h=self._trend(now),
            anomalies=self._anomalies(now),
        )

    def _deltas(self, now: datetime, today_start: datetime, avg_today: float | None) -> KpiDeltas:
        """Hoy (00:00 → ahora) frente a ayer (00:00 → la misma hora), según doc 05 §6."""
        y_start, y_end = same_window_yesterday(now)
        crit = Severity.CRITICA
        return KpiDeltas(
            active_alerts=delta(
                self.alerts.count_detected_between(today_start, now),
                self.alerts.count_detected_between(y_start, y_end),
            ),
            critical_alerts=delta(
                self.alerts.count_detected_between(today_start, now, severity=crit),
                self.alerts.count_detected_between(y_start, y_end, severity=crit),
            ),
            open_incidents=delta(
                self.incidents.count_opened_between(today_start, now),
                self.incidents.count_opened_between(y_start, y_end),
            ),
            resolved_today=delta(
                self.incidents.count_resolved_between(today_start, now),
                self.incidents.count_resolved_between(y_start, y_end),
            ),
            avg_response_seconds_today=delta(
                _round_or_none(avg_today),
                _round_or_none(self.incidents.avg_response_between(y_start, y_end)),
            ),
        )

    def _by_category(self, now: datetime) -> list[CategoryCount]:
        counts = self.incidents.counts_by_type_opened_since(now - timedelta(days=CATEGORY_DAYS))
        names = {t.code: t.name for t in self.catalog.list_alert_types()}
        items = [
            CategoryCount(type_code=code, type_name=names.get(code, code), count=count)
            for code, count in counts.items()
            if count > 0
        ]
        return sorted(items, key=lambda c: (-c.count, c.type_code))

    def _trend(self, now: datetime) -> list[HourCount]:
        """24 horas consecutivas (la última es la hora en curso), rellenando con 0 las horas sin alertas."""
        first = bogota_hour_start(now) - timedelta(hours=TREND_HOURS - 1)
        counts = self.alerts.counts_by_hour(first)
        hours = [first + timedelta(hours=i) for i in range(TREND_HOURS)]
        return [HourCount(hour=to_bogota(h), count=counts.get(h, 0)) for h in hours]

    def _anomalies(self, now: datetime) -> list[Anomaly]:
        recent_since = now - timedelta(minutes=ANOMALY_RECENT_MINUTES)
        week_since = now - timedelta(days=ANOMALY_WINDOW_DAYS)
        # La referencia excluye la propia hora evaluada (doc 05 §7): 7 días menos la última hora.
        hours = ANOMALY_WINDOW_DAYS * 24 - 1
        zone_names = {z.id: z.name for z in self.catalog.list_zones()}
        type_names = {t.code: t.name for t in self.catalog.list_alert_types()}
        recent_zone = self.alerts.counts_by_zone(recent_since)
        by_zone = anomaly_rules.detect(
            "zone",
            recent_zone,
            _exclude(self.alerts.counts_by_zone(week_since), recent_zone),
            zone_names,
            hours=hours,
        )
        recent_type = self.alerts.counts_by_type(recent_since)
        by_type = anomaly_rules.detect(
            "type",
            recent_type,
            _exclude(self.alerts.counts_by_type(week_since), recent_type),
            type_names,
            hours=hours,
        )
        return by_zone + by_type


def _exclude(weekly: dict[str, int], recent: dict[str, int]) -> dict[str, int]:
    """Conteos de la ventana semanal sin la última hora evaluada."""
    return {key: max(count - recent.get(key, 0), 0) for key, count in weekly.items()}
