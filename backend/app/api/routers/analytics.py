"""Análisis: GET /analytics/* (lectura, sin X-Actor-Id). `days` = 7, 14 o 30 (otro valor → 30)."""

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.api.schemas.analytics import DailySeverityOut, OutcomesOut, TimesOut, TypeCountOut, ZoneCountOut
from app.api.schemas.dashboard import AnomalyOut
from app.domain.catalogs import utcnow
from app.services.analytics_service import AnalyticsService, normalize_days

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/by-zone", response_model=list[ZoneCountOut], response_model_by_alias=True)
def by_zone(session: SessionDep, days: str | None = None) -> list[ZoneCountOut]:
    items = AnalyticsService(session).by_zone(utcnow(), normalize_days(days))
    return [ZoneCountOut.from_item(z) for z in items]


@router.get("/by-type", response_model=list[TypeCountOut], response_model_by_alias=True)
def by_type(session: SessionDep, days: str | None = None) -> list[TypeCountOut]:
    items = AnalyticsService(session).by_type(utcnow(), normalize_days(days))
    return [TypeCountOut.from_item(t) for t in items]


@router.get("/trend", response_model=list[DailySeverityOut], response_model_by_alias=True)
def trend(session: SessionDep, days: str | None = None) -> list[DailySeverityOut]:
    items = AnalyticsService(session).trend(utcnow(), normalize_days(days))
    return [DailySeverityOut.from_item(d) for d in items]


@router.get("/times", response_model=TimesOut, response_model_by_alias=True)
def times(session: SessionDep, days: str | None = None) -> TimesOut:
    return TimesOut.from_times(AnalyticsService(session).times(utcnow(), normalize_days(days)))


@router.get("/outcomes", response_model=OutcomesOut, response_model_by_alias=True)
def outcomes(session: SessionDep, days: str | None = None) -> OutcomesOut:
    return OutcomesOut.from_outcomes(AnalyticsService(session).outcomes(utcnow(), normalize_days(days)))


@router.get("/anomalies", response_model=list[AnomalyOut], response_model_by_alias=True)
def anomalies(session: SessionDep) -> list[AnomalyOut]:
    return [AnomalyOut.from_anomaly(a) for a in AnalyticsService(session).anomalies(utcnow())]
