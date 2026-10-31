"""Configuración de la demo: GET y PUT /settings (solo supervisor; spec 008 R2)."""

from fastapi import APIRouter

from app.api.deps import PublisherDep, SessionDep, SimulatorDep, SupervisorDep
from app.api.schemas.settings import SettingsIn, SettingsOut
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsOut, response_model_by_alias=True)
def get_settings(session: SessionDep, simulator: SimulatorDep, _supervisor: SupervisorDep) -> SettingsOut:
    view = SettingsService(session).get(simulator.running, simulator.next_run_at)
    return SettingsOut.from_view(view)


@router.put("", response_model=SettingsOut, response_model_by_alias=True)
def update_settings(
    body: SettingsIn,
    session: SessionDep,
    simulator: SimulatorDep,
    supervisor: SupervisorDep,
    publisher: PublisherDep,
) -> SettingsOut:
    # Tras el commit, el servicio reprograma el simulador si cambió el encendido o el intervalo; la
    # respuesta (y `settings.updated`) llevan el `nextRunAt` nuevo.
    view = SettingsService(session, publisher).update(
        body.to_update(), supervisor, simulator.running, simulator.next_run_at, simulator.reschedule
    )
    return SettingsOut.from_view(view)
