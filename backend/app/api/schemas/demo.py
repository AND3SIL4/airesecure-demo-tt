"""DTOs de la demo: escenarios predefinidos (specs/003-tiempo-real/contracts/api-realtime.md)."""

from app.api.schemas.base import ApiModel
from app.domain.enums import Severity
from app.services.scenario_service import ScenarioView


class ScenarioOut(ApiModel):
    id: str
    name: str
    type_code: str
    severity: Severity
    zone_id: str
    source_id: str
    confidence: float

    @classmethod
    def from_view(cls, view: ScenarioView) -> "ScenarioOut":
        scenario = view.scenario
        return cls(
            id=scenario.id,
            name=scenario.name,
            type_code=scenario.type_code,
            severity=view.severity,
            zone_id=scenario.zone_id,
            source_id=scenario.source_id,
            confidence=scenario.confidence,
        )
