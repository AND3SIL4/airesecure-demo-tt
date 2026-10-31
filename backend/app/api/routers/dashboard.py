"""Resumen operativo: GET /dashboard/summary (lectura, sin X-Actor-Id)."""

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.api.schemas.dashboard import DashboardSummaryOut
from app.domain.catalogs import utcnow
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryOut,
    response_model_by_alias=True,
)
def get_summary(session: SessionDep) -> DashboardSummaryOut:
    return DashboardSummaryOut.from_summary(DashboardService(session).summary(utcnow()))
