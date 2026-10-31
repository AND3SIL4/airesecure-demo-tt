"""Demo: GET /demo/scenarios, POST /demo/scenarios/{id}/trigger y POST /demo/reset (solo supervisor)."""

from fastapi import APIRouter, status

from app.api.deps import DemoResetterDep, DetachedSupervisorDep, PublisherDep, SessionDep, SupervisorDep
from app.api.schemas.alerts import AlertDetailOut
from app.api.schemas.demo import ScenarioOut
from app.api.schemas.settings import ResetOut
from app.services.demo_service import DemoService
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


@router.post("/reset", response_model=ResetOut, response_model_by_alias=True)
async def reset_demo(
    supervisor: DetachedSupervisorDep, resetter: DemoResetterDep, publisher: PublisherDep
) -> ResetOut:
    """Asíncrono porque pausa y reanuda el simulador en el event loop; el trabajo de base de datos corre en
    un hilo dentro del adaptador."""
    return ResetOut.from_result(await DemoService(resetter, publisher).reset(supervisor))
