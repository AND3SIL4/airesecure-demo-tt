"""DTOs de Análisis (specs/007-analisis-reportes/contracts/api-analytics.md, doc 08 §3.5)."""

from datetime import date

from app.api.schemas.base import ApiModel
from app.services.analytics_service import DailySeverity, Outcomes, Times, TypeCount, ZoneCount


class ZoneCountOut(ApiModel):
    zone_id: str
    zone_name: str
    count: int

    @classmethod
    def from_item(cls, z: ZoneCount) -> "ZoneCountOut":
        return cls(zone_id=z.zone_id, zone_name=z.zone_name, count=z.count)


class TypeCountOut(ApiModel):
    type_code: str
    type_name: str
    count: int

    @classmethod
    def from_item(cls, t: TypeCount) -> "TypeCountOut":
        return cls(type_code=t.type_code, type_name=t.type_name, count=t.count)


class DailySeverityOut(ApiModel):
    date: date
    total: int
    critica: int
    alta: int
    media: int
    baja: int

    @classmethod
    def from_item(cls, d: DailySeverity) -> "DailySeverityOut":
        return cls(date=d.date, total=d.total, critica=d.critica, alta=d.alta, media=d.media, baja=d.baja)


class DailyTimesOut(ApiModel):
    date: date
    avg_response_seconds: int | None
    avg_resolution_seconds: int | None


class TimesOut(ApiModel):
    avg_response_seconds: int | None
    avg_resolution_seconds: int | None
    by_day: list[DailyTimesOut]

    @classmethod
    def from_times(cls, t: Times) -> "TimesOut":
        return cls(
            avg_response_seconds=t.avg_response_seconds,
            avg_resolution_seconds=t.avg_resolution_seconds,
            by_day=[
                DailyTimesOut(
                    date=d.date,
                    avg_response_seconds=d.avg_response_seconds,
                    avg_resolution_seconds=d.avg_resolution_seconds,
                )
                for d in t.by_day
            ],
        )


class OutcomesOut(ApiModel):
    confirmed: int
    dismissed: int
    confirmation_rate: float | None
    below_threshold: int

    @classmethod
    def from_outcomes(cls, o: Outcomes) -> "OutcomesOut":
        return cls(
            confirmed=o.confirmed,
            dismissed=o.dismissed,
            confirmation_rate=o.confirmation_rate,
            below_threshold=o.below_threshold,
        )
