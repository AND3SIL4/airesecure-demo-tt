"""Casos de uso de Análisis (GET /analytics/*), de solo lectura (plan R1 de 007, doc 05 §6-§7).

"Incidentes en el rango" = `opened_at ≥ now − days`. Las series diarias usan días completos de Bogotá: el
primer día es el de hoy menos `days − 1` y se rellenan con 0 los días sin datos.
"""

from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlmodel import Session

from app.domain import anomalies as anomaly_rules
from app.domain.anomalies import Anomaly
from app.domain.catalogs import SETTING_BELOW_THRESHOLD
from app.domain.enums import Severity
from app.domain.time import bogota_date, bogota_day_start
from app.repositories.alert_repo import AlertRepository
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.incident_repo import IncidentRepository
from app.repositories.settings_repo import SettingsRepository

ALLOWED_DAYS: tuple[int, ...] = (7, 14, 30)
DEFAULT_DAYS = 30
ANOMALY_RECENT_MINUTES = 60
ANOMALY_WINDOW_DAYS = 7


def normalize_days(raw: str | int | None) -> int:
    """7, 14 o 30; cualquier otro valor (o ninguno) → 30."""
    try:
        value = int(raw) if raw is not None else DEFAULT_DAYS
    except (TypeError, ValueError):
        return DEFAULT_DAYS
    return value if value in ALLOWED_DAYS else DEFAULT_DAYS


@dataclass(frozen=True)
class ZoneCount:
    zone_id: str
    zone_name: str
    count: int


@dataclass(frozen=True)
class TypeCount:
    type_code: str
    type_name: str
    count: int


@dataclass(frozen=True)
class DailySeverity:
    date: date
    total: int
    critica: int
    alta: int
    media: int
    baja: int


@dataclass(frozen=True)
class DailyTimes:
    date: date
    avg_response_seconds: int | None
    avg_resolution_seconds: int | None


@dataclass(frozen=True)
class Times:
    avg_response_seconds: int | None
    avg_resolution_seconds: int | None
    by_day: list[DailyTimes]


@dataclass(frozen=True)
class Outcomes:
    confirmed: int
    dismissed: int
    confirmation_rate: float | None  # 0..1
    below_threshold: int


def _round_or_none(value: float | None) -> int | None:
    return None if value is None else round(value)


def _exclude(weekly: dict[str, int], recent: dict[str, int]) -> dict[str, int]:
    """Conteos de la ventana semanal sin la última hora evaluada."""
    return {key: max(count - recent.get(key, 0), 0) for key, count in weekly.items()}


class AnalyticsService:
    def __init__(self, session: Session) -> None:
        self.alerts = AlertRepository(session)
        self.incidents = IncidentRepository(session)
        self.catalog = CatalogRepository(session)
        self.settings = SettingsRepository(session)

    def by_zone(self, now: datetime, days: int) -> list[ZoneCount]:
        """Las 10 zonas (incluidas las que tienen 0), en orden descendente por conteo."""
        counts = self.incidents.counts_by_zone_opened_since(now - timedelta(days=days))
        items = [
            ZoneCount(zone_id=z.id, zone_name=z.name, count=counts.get(z.id, 0))
            for z in self.catalog.list_zones()
        ]
        return sorted(items, key=lambda z: (-z.count, z.zone_id))

    def by_type(self, now: datetime, days: int) -> list[TypeCount]:
        """Solo los tipos con incidentes en el rango, en orden descendente."""
        counts = self.incidents.counts_by_type_opened_since(now - timedelta(days=days))
        names = {t.code: t.name for t in self.catalog.list_alert_types()}
        items = [
            TypeCount(type_code=code, type_name=names.get(code, code), count=count)
            for code, count in counts.items()
            if count > 0
        ]
        return sorted(items, key=lambda t: (-t.count, t.type_code))

    def trend(self, now: datetime, days: int) -> list[DailySeverity]:
        first_start, dates = self._days(now, days)
        counts = self.incidents.daily_by_severity_since(first_start)
        result: list[DailySeverity] = []
        for day in dates:
            by_sev = counts.get(day.isoformat(), {})
            values = {sev: by_sev.get(sev.value, 0) for sev in Severity}
            result.append(
                DailySeverity(
                    date=day,
                    total=sum(values.values()),
                    critica=values[Severity.CRITICA],
                    alta=values[Severity.ALTA],
                    media=values[Severity.MEDIA],
                    baja=values[Severity.BAJA],
                )
            )
        return result

    def times(self, now: datetime, days: int) -> Times:
        avg_response, avg_resolution = self.incidents.avg_times_since(now - timedelta(days=days))
        first_start, dates = self._days(now, days)
        daily = self.incidents.daily_times_since(first_start)
        by_day = [
            DailyTimes(
                date=day,
                avg_response_seconds=_round_or_none(daily.get(day.isoformat(), (None, None))[0]),
                avg_resolution_seconds=_round_or_none(daily.get(day.isoformat(), (None, None))[1]),
            )
            for day in dates
        ]
        return Times(
            avg_response_seconds=_round_or_none(avg_response),
            avg_resolution_seconds=_round_or_none(avg_resolution),
            by_day=by_day,
        )

    def outcomes(self, now: datetime, days: int) -> Outcomes:
        """Alertas detectadas en el rango; `belowThreshold` es el contador acumulado (setting)."""
        confirmed, dismissed = self.alerts.outcome_counts_since(now - timedelta(days=days))
        decided = confirmed + dismissed
        return Outcomes(
            confirmed=confirmed,
            dismissed=dismissed,
            confirmation_rate=round(confirmed / decided, 4) if decided else None,
            below_threshold=self.settings.get_int(SETTING_BELOW_THRESHOLD, 0),
        )

    def anomalies(self, now: datetime) -> list[Anomaly]:
        """Anomalías por zona y por tipo (doc 05 §7); también las usa el Resumen operativo."""
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

    @staticmethod
    def _days(now: datetime, days: int) -> tuple[datetime, list[date]]:
        """(inicio UTC del primer día de Bogotá, `days` fechas consecutivas que terminan hoy)."""
        first_start = bogota_day_start(now) - timedelta(days=days - 1)
        today = bogota_date(now)
        return first_start, [today - timedelta(days=days - 1 - i) for i in range(days)]
