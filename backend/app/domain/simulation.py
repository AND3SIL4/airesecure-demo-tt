"""Reglas puras del simulador (doc 10 §7, research R5): tipo por peso, zona compatible, fuente y confianza."""

import random
from collections.abc import Sequence
from dataclasses import dataclass

from app.domain.enums import Severity, SourceKind
from app.domain.models import AlertType, Source, Zone
from app.domain.scoring import elevate_severity

PLATFORM_ZONE_ID = "T1-PLATAFORMA"

# Confianza simulada: uniforme en este rango, redondeada a 2 decimales.
CONFIDENCE_RANGE: tuple[float, float] = (0.50, 0.98)
# El intervalo real es aleatorio entre 0,75× y 1,5× el configurado.
INTERVAL_JITTER: tuple[float, float] = (0.75, 1.5)
# Variables de las plantillas de descripción ({min} y {n}).
MINUTES_RANGE: tuple[int, int] = (5, 20)
PEOPLE_RANGE: tuple[int, int] = (40, 120)


@dataclass(frozen=True)
class ZoneRule:
    """Zonas compatibles con un tipo: lista explícita (`only`) o todas salvo `exclude` / las restringidas."""

    only: frozenset[str] | None = None
    exclude: frozenset[str] = frozenset()
    unrestricted_only: bool = False

    def allows(self, zone: Zone) -> bool:
        if self.only is not None:
            return zone.id in self.only
        if zone.id in self.exclude:
            return False
        return not (self.unrestricted_only and zone.restricted)


# Compatibilidad tipo → zonas (doc 10 §7). `reporte_operador` nunca lo genera el simulador.
ZONE_COMPATIBILITY: dict[str, ZoneRule] = {
    "acceso_restringido": ZoneRule(only=frozenset({"T1-SERVICIO", PLATFORM_ZONE_ID})),
    "equipaje_abandonado": ZoneRule(
        only=frozenset({"T1-EQUIPAJES", "T1-HALL", "T1-CHECKIN", "T1-EMBARQUE-A"})
    ),
    "objeto_inusual": ZoneRule(exclude=frozenset({PLATFORM_ZONE_ID})),
    "concentracion_personas": ZoneRule(
        only=frozenset(
            {"T1-HALL", "T1-CHECKIN", "T1-SEGURIDAD", "T1-MIGRACION", "T1-EMBARQUE-A", "T1-PUERTAS"}
        )
    ),
    "comportamiento_anomalo": ZoneRule(unrestricted_only=True),
    "permanencia_inusual": ZoneRule(unrestricted_only=True),
}

# Los sensores de acceso solo detectan accesos; el resto de tipos se detecta con cámaras.
SENSOR_TYPES: frozenset[str] = frozenset({"acceso_restringido"})


@dataclass(frozen=True)
class SimulatedEvent:
    """Evento detectado (simulador o escenario) antes de convertirse en alerta."""

    type_code: str
    zone_id: str
    source_id: str
    confidence: float
    severity: Severity
    template_index: int = 0
    minutes: int = 10
    people: int = 60


def _source_kinds(type_code: str) -> frozenset[SourceKind]:
    if type_code in SENSOR_TYPES:
        return frozenset({SourceKind.CAMARA, SourceKind.SENSOR})
    return frozenset({SourceKind.CAMARA})


def _candidates(
    alert_type: AlertType, zones: Sequence[Zone], sources: Sequence[Source]
) -> list[tuple[Zone, list[Source]]]:
    rule = ZONE_COMPATIBILITY.get(alert_type.code)
    if rule is None:
        return []
    kinds = _source_kinds(alert_type.code)
    result: list[tuple[Zone, list[Source]]] = []
    for zone in zones:
        if not rule.allows(zone):
            continue
        zone_sources = [s for s in sources if s.zone_id == zone.id and s.kind in kinds]
        if zone_sources:
            result.append((zone, zone_sources))
    return result


def draw_event(
    rng: random.Random,
    alert_types: Sequence[AlertType],
    zones: Sequence[Zone],
    sources: Sequence[Source],
) -> SimulatedEvent:
    """Elige tipo (por `scenario_weight`, excluye 0), zona compatible, fuente, confianza y severidad.

    Severidad: la del tipo, +1 nivel si la zona es restringida. No aplica el umbral (lo hace el servicio).
    """
    options: list[tuple[AlertType, Severity, list[tuple[Zone, list[Source]]]]] = []
    for alert_type in alert_types:
        if alert_type.scenario_weight <= 0 or alert_type.default_severity is None:
            continue
        candidates = _candidates(alert_type, zones, sources)
        if candidates:
            options.append((alert_type, alert_type.default_severity, candidates))
    if not options:
        raise ValueError("No hay tipos de alerta simulables con zonas y fuentes compatibles.")

    weights = [opt[0].scenario_weight for opt in options]
    alert_type, base_severity, candidates = rng.choices(options, weights=weights, k=1)[0]
    zone, zone_sources = rng.choice(candidates)
    source = rng.choice(zone_sources)
    confidence = round(rng.uniform(*CONFIDENCE_RANGE), 2)
    return SimulatedEvent(
        type_code=alert_type.code,
        zone_id=zone.id,
        source_id=source.id,
        confidence=confidence,
        severity=elevate_severity(base_severity, zone.restricted),
        template_index=rng.randrange(1000),
        minutes=rng.randint(*MINUTES_RANGE),
        people=rng.randint(*PEOPLE_RANGE),
    )


def next_delay(rng: random.Random, interval_seconds: float) -> float:
    """Segundos hasta el próximo evento: entre 0,75× y 1,5× el intervalo configurado."""
    return rng.uniform(*INTERVAL_JITTER) * interval_seconds


def is_below_threshold(confidence: float, threshold: float | None) -> bool:
    """Un evento con confianza menor que el umbral del tipo no crea alerta (cuenta como "bajo umbral")."""
    return threshold is not None and confidence < threshold
