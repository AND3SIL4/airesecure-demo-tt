"""Escenarios predefinidos de la demo (doc 10 §8). Ignoran el umbral: siempre crean la alerta."""

from dataclasses import dataclass

from app.domain.enums import Severity
from app.domain.scoring import elevate_severity
from app.domain.simulation import SimulatedEvent


@dataclass(frozen=True)
class Scenario:
    id: str
    name: str
    type_code: str
    base_severity: Severity
    zone_id: str
    source_id: str
    confidence: float


SCENARIOS: tuple[Scenario, ...] = (
    Scenario("E-1", "Equipaje abandonado en la sala de equipajes", "equipaje_abandonado",
             Severity.CRITICA, "T1-EQUIPAJES", "CAM-T1-012", 0.94),
    Scenario("E-2", "Intrusión en la plataforma", "acceso_restringido",
             Severity.ALTA, "T1-PLATAFORMA", "SEN-T1-005", 0.88),
    Scenario("E-3", "Aglomeración en la sala de embarque", "concentracion_personas",
             Severity.MEDIA, "T1-EMBARQUE-A", "CAM-T1-008", 0.71),
    Scenario("E-4", "Permanencia prolongada en la zona comercial", "permanencia_inusual",
             Severity.BAJA, "T1-COMERCIAL", "CAM-T1-014", 0.62),
)  # fmt: skip


def find_scenario(scenario_id: str) -> Scenario | None:
    return next((s for s in SCENARIOS if s.id == scenario_id), None)


def final_severity(scenario: Scenario, zone_restricted: bool) -> Severity:
    """Severidad final: la base, +1 nivel si la zona es restringida (E-2 queda crítica)."""
    return elevate_severity(scenario.base_severity, zone_restricted)


def to_event(scenario: Scenario, zone_restricted: bool) -> SimulatedEvent:
    """Convierte el escenario en el evento que se registra como alerta (plantilla 0 del tipo)."""
    return SimulatedEvent(
        type_code=scenario.type_code,
        zone_id=scenario.zone_id,
        source_id=scenario.source_id,
        confidence=scenario.confidence,
        severity=final_severity(scenario, zone_restricted),
    )
