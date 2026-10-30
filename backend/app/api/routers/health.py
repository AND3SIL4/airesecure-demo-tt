"""GET /health."""

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.api.schemas.catalog import HealthOut
from app.services.health_service import HealthService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthOut, response_model_by_alias=True)
def get_health(session: SessionDep) -> HealthOut:
    return HealthOut.from_status(HealthService(session).check())
