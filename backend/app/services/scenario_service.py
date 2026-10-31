"""Casos de uso de los escenarios de la demo (doc 10 §8): listar y disparar (solo supervisor)."""

from dataclasses import dataclass

from sqlmodel import Session

from app.domain.enums import AlertOrigin, Severity, TimelineAction
from app.domain.errors import NO_ENCONTRADO, DomainError
from app.domain.models import User
from app.domain.scenarios import SCENARIOS, Scenario, final_severity, find_scenario, to_event
from app.repositories.catalog_repo import CatalogRepository
from app.services.alert_service import AlertDetailView, AlertService, TimelineNote
from app.services.ports import EventPublisher


@dataclass(frozen=True)
class ScenarioView:
    scenario: Scenario
    severity: Severity  # final, ya elevada si la zona es restringida


class ScenarioService:
    def __init__(self, session: Session, publisher: EventPublisher | None = None) -> None:
        self.session = session
        self.catalog = CatalogRepository(session)
        self.alert_service = AlertService(session, publisher)

    def list(self) -> list[ScenarioView]:
        return [ScenarioView(scenario=s, severity=final_severity(s, self._restricted(s))) for s in SCENARIOS]

    def trigger(self, scenario_id: str, actor: User) -> AlertDetailView:
        """Crea la alerta del escenario (origin escenario, actor Sistema) e inserta `scenario_triggered`
        con el supervisor en la misma transacción; publica `alert.created` tras el commit."""
        scenario = find_scenario(scenario_id)
        if scenario is None:
            raise DomainError(NO_ENCONTRADO, "El escenario no existe.")
        event = to_event(scenario, self._restricted(scenario))
        alert = self.alert_service.create_from_event(
            event,
            AlertOrigin.ESCENARIO,
            actor=None,
            extra_timeline=[
                TimelineNote(
                    action=TimelineAction.SCENARIO_TRIGGERED,
                    actor_id=actor.id,
                    payload={"scenarioId": scenario.id},
                )
            ],
        )
        return self.alert_service.get_detail(alert.id)

    def _restricted(self, scenario: Scenario) -> bool:
        zone = self.catalog.get_zone(scenario.zone_id)
        if zone is None:
            raise RuntimeError(f"Falta la zona {scenario.zone_id} del escenario {scenario.id}")
        return zone.restricted
