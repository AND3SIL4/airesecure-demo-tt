"""Demo: GET /demo/scenarios y POST /demo/scenarios/{id}/trigger (solo supervisor)."""

from fastapi import APIRouter, status

from app.api.deps import PublisherDep, SessionDep, SupervisorDep
from app.api.schemas.alerts import AlertDetailOut
from app.api.schemas.demo import ScenarioOut
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/scenarios", response_model=list[ScenarioOut], response_model_by_alias=True)
def list_scenarios(session: SessionDep, _supervisor: SupervisorDep) -> list[ScenarioOut]:
    return [ScenarioOut.from_view(v) for v in ScenarioService(session).list()]


@router.post(
    "/scenarios/{scenario_id}/trigger",
    response_model=AlertDetailOut,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def trigger_scenario(
    scenario_id: str, session: SessionDep, supervisor: SupervisorDep, publisher: PublisherDep
) -> AlertDetailOut:
    return AlertDetailOut.from_detail(ScenarioService(session, publisher).trigger(scenario_id, supervisor))
