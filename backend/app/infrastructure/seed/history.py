"""Planificación del histórico de 30 días hasta ayer a las 23:59 (doc 10 §3, research R6 de 004).

Reproducible con `random.Random(2048)`: ≈ 220 alertas (≈ 68 % confirmadas con su incidente resuelto y el
resto descartadas), picos horarios, +15 % en la última semana, severidades 8/22/45/25 % en las confirmadas,
zonas ponderadas y compatibles con el tipo, ≈ 10 % de escalados y eventos completos.
"""

import random
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, time, timedelta

from app.domain.enums import DismissReason, Severity, SourceKind
from app.domain.models import Source, Zone
from app.domain.simulation import SENSOR_TYPES, ZONE_COMPATIBILITY
from app.domain.time import BOGOTA_TZ
from app.infrastructure.seed.catalogs import TEAMS
from app.infrastructure.seed.plan import (
    AlertBase,
    IncidentLifecycle,
    PlannedAlert,
    TeamStep,
    plan_confirmed,
    plan_dismissed,
)

SEED = 2048
HISTORY_DAYS = 30
TARGET_ALERTS = 220
CONFIRMED_RATIO = 0.68
ESCALATED_RATIO = 0.10
LAST_WEEK_DAYS = 7
LAST_WEEK_FACTOR = 1.15
MANUAL_RATIO = 0.04  # reportes de operador entre las confirmadas

TEAM_NAMES: dict[str, str] = {t["id"]: t["name"] for t in TEAMS}

# Pesos por hora local (picos 06-09 h y 17-20 h; valle 01-05 h).
HOUR_WEIGHTS: list[float] = [
    1.0, 0.4, 0.4, 0.4, 0.4, 1.2,   # 00-05
    4.0, 4.0, 4.0, 2.2, 2.0, 2.0,   # 06-11
    2.2, 2.0, 2.0, 2.0, 2.4, 4.0,   # 12-17
    4.0, 4.0, 2.0, 1.6, 1.4, 1.2,   # 18-23
]  # fmt: skip

# Zonas más frecuentes: Sala de embarque A, Hall principal, Filtro de seguridad y Sala de equipajes.
ZONE_WEIGHTS: dict[str, float] = {
    "T1-EMBARQUE-A": 5,
    "T1-HALL": 5,
    "T1-SEGURIDAD": 4,
    "T1-EQUIPAJES": 4,
    "T1-CHECKIN": 2.5,
    "T1-PUERTAS": 2.5,
    "T1-MIGRACION": 2,
    "T1-COMERCIAL": 1.5,
    "T1-SERVICIO": 1.5,
    "T1-PLATAFORMA": 1.5,
}

# Proporción de severidades de las confirmadas y tipos cuya severidad por defecto coincide.
SEVERITY_SHARE: list[tuple[Severity, float]] = [
    (Severity.CRITICA, 0.08),
    (Severity.ALTA, 0.22),
    (Severity.MEDIA, 0.45),
    (Severity.BAJA, 0.25),
]
# `acceso_restringido` (alta) sube a crítica en zonas restringidas (doc 05 §4.2).
TYPES_BY_SEVERITY: dict[Severity, list[tuple[str, int]]] = {
    Severity.CRITICA: [("equipaje_abandonado", 3), ("acceso_restringido", 1)],
    Severity.ALTA: [("objeto_inusual", 2), ("acceso_restringido", 1)],
    Severity.MEDIA: [("comportamiento_anomalo", 1), ("concentracion_personas", 1)],
    Severity.BAJA: [("permanencia_inusual", 1)],
}
DEFAULT_SEVERITY: dict[str, Severity] = {
    "equipaje_abandonado": Severity.CRITICA,
    "objeto_inusual": Severity.ALTA,
    "acceso_restringido": Severity.ALTA,
    "comportamiento_anomalo": Severity.MEDIA,
    "concentracion_personas": Severity.MEDIA,
    "permanencia_inusual": Severity.BAJA,
}
# Pesos del simulador (doc 05 §4.2) para las descartadas.
DISMISSED_TYPE_WEIGHTS: list[tuple[str, int]] = [
    ("equipaje_abandonado", 1),
    ("objeto_inusual", 2),
    ("acceso_restringido", 2),
    ("comportamiento_anomalo", 3),
    ("concentracion_personas", 3),
    ("permanencia_inusual", 4),
]
THRESHOLDS: dict[str, float] = {
    "equipaje_abandonado": 0.80,
    "objeto_inusual": 0.75,
    "acceso_restringido": 0.70,
    "comportamiento_anomalo": 0.65,
    "concentracion_personas": 0.60,
    "permanencia_inusual": 0.60,
}

# Escalamiento al especializado según el tipo (Operaciones no es especializado: no es destino válido).
ESCALATION_TEAM: dict[str, str] = {
    "equipaje_abandonado": "eod",
    "objeto_inusual": "eod",
    "acceso_restringido": "policia",
    "comportamiento_anomalo": "policia",
    "concentracion_personas": "medico",
    "permanencia_inusual": "medico",
    "reporte_operador": "medico",
}
ESCALATION_REASONS: dict[str, list[str]] = {
    "eod": [
        "Objeto no identificado; se requiere revisión de la Unidad EOD.",
        "El propietario no aparece y el bulto no es identificable; se solicita EOD.",
    ],
    "policia": [
        "Persona sin credencial válida en zona restringida; se requiere apoyo policial.",
        "Conducta persistente tras el contacto inicial; se solicita la Policía aeroportuaria.",
    ],
    "medico": [
        "Pasajero con signos de malestar en la zona; se solicita atención médica.",
        "Persona desorientada que requiere valoración médica.",
    ],
}
RESOLUTION_NOTES: dict[str, list[str]] = {
    "equipaje_abandonado": [
        "Equipaje de pasajero recuperado y verificado; el propietario fue ubicado.",
        "Maleta entregada a su propietario tras la verificación en sitio.",
    ],
    "objeto_inusual": [
        "Objeto identificado como equipo de mantenimiento; se retiró del área.",
        "Se verificó el objeto: pertenencia de un pasajero, sin riesgo.",
    ],
    "acceso_restringido": [
        "Acceso verificado; la persona fue acompañada fuera de la zona y se reportó.",
        "Credencial validada con el área de seguridad; se corrigió el registro del sensor.",
    ],
    "comportamiento_anomalo": [
        "Se contactó a la persona; situación aclarada sin novedad.",
        "Pasajero orientado hacia su puerta de embarque; sin riesgo.",
    ],
    "concentracion_personas": [
        "Operaciones habilitó filas alternas; el flujo se normalizó.",
        "Se redistribuyó a los pasajeros entre las puertas; ocupación normal.",
    ],
    "permanencia_inusual": [
        "Pasajero en espera legítima de un vuelo demorado; sin novedad.",
        "Personal de atención confirmó la espera de un pasajero en conexión.",
    ],
    "reporte_operador": [
        "Situación verificada en sitio y atendida por el equipo asignado.",
        "Se atendió el reporte del operador; sin riesgo adicional.",
    ],
}
DISMISS_REASONS: list[tuple[DismissReason, int, list[str | None]]] = [
    (DismissReason.MOVIMIENTO_NORMAL, 4, [None, "Flujo normal de pasajeros en la zona."]),
    (DismissReason.PERTENENCIA_PERSONAL, 3, [None, "Objeto del personal de limpieza identificado."]),
    (DismissReason.FALLA_CAMARA, 2, [None, "Reflejo en la cámara confundido con una persona."]),
    (DismissReason.PERSONAL_AUTORIZADO, 2, [None, "Personal de mantenimiento con credencial vigente."]),
    (
        DismissReason.OTRO,
        1,
        [
            "Simulacro programado por el área de seguridad.",
            "Prueba de equipos coordinada con Operaciones.",
        ],
    ),
]
OPERATORS = ["op-01", "op-02"]
SUPERVISOR = "sup-a"
SUPERVISOR_SHARE = 0.10


@dataclass(frozen=True)
class _Catalog:
    zones: dict[str, Zone]
    sources: list[Source]


def _minutes(rng: random.Random, low: float, high: float) -> timedelta:
    return timedelta(seconds=rng.randint(int(low * 60), int(high * 60)))


def _actor(rng: random.Random) -> str:
    return SUPERVISOR if rng.random() < SUPERVISOR_SHARE else rng.choice(OPERATORS)


def _daily_counts(rng: random.Random) -> list[int]:
    """Alertas por día (el índice 0 es hace 30 días); la última semana tiene ≈ +15 %."""
    factors = [LAST_WEEK_FACTOR if d >= HISTORY_DAYS - LAST_WEEK_DAYS else 1.0 for d in range(HISTORY_DAYS)]
    base = TARGET_ALERTS / sum(factors)
    counts = [max(1, round(base * f + rng.uniform(-1.5, 1.5))) for f in factors]
    # Ajuste fino para acercarse al objetivo sin romper la tendencia.
    while sum(counts) > TARGET_ALERTS:
        counts[rng.randrange(HISTORY_DAYS - LAST_WEEK_DAYS)] -= 1
    while sum(counts) < TARGET_ALERTS:
        counts[rng.randrange(HISTORY_DAYS - LAST_WEEK_DAYS, HISTORY_DAYS)] += 1
    return counts


def _detections(rng: random.Random, now: datetime) -> list[datetime]:
    """Momentos de detección (UTC) desde hace 30 días hasta ayer a las 23:59 (hora de Bogotá)."""
    today_local = now.astimezone(BOGOTA_TZ).date()
    result: list[datetime] = []
    for index, count in enumerate(_daily_counts(rng)):
        day = today_local - timedelta(days=HISTORY_DAYS - index)
        midnight = datetime.combine(day, time(0, 0), tzinfo=BOGOTA_TZ)
        for hour in rng.choices(range(24), weights=HOUR_WEIGHTS, k=count):
            moment = midnight + timedelta(hours=hour, minutes=rng.randrange(60), seconds=rng.randrange(60))
            result.append(moment)
    return sorted(result)


def _pick_zone_and_source(rng: random.Random, type_code: str, catalog: _Catalog) -> tuple[Zone, Source]:
    rule = ZONE_COMPATIBILITY[type_code]
    kinds = {SourceKind.CAMARA, SourceKind.SENSOR} if type_code in SENSOR_TYPES else {SourceKind.CAMARA}
    options: list[tuple[Zone, list[Source]]] = []
    for zone in catalog.zones.values():
        zone_sources = [s for s in catalog.sources if s.zone_id == zone.id and s.kind in kinds]
        if rule.allows(zone) and zone_sources:
            options.append((zone, zone_sources))
    zone, zone_sources = rng.choices(options, weights=[ZONE_WEIGHTS.get(z.id, 1) for z, _ in options])[0]
    return zone, rng.choice(zone_sources)


def _confirmed_type(rng: random.Random, severity: Severity, catalog: _Catalog) -> tuple[str, Zone, Source]:
    """Tipo según la severidad; `acceso_restringido` solo es crítico en zonas restringidas."""
    names, weights = zip(*TYPES_BY_SEVERITY[severity], strict=True)
    type_code = rng.choices(names, weights=weights)[0]
    zone, source = _pick_zone_and_source(rng, type_code, catalog)
    return type_code, zone, source


def _base(
    rng: random.Random,
    type_code: str,
    severity: Severity,
    zone: Zone,
    source: Source,
    confidence: float | None,
    detected_ago: timedelta,
    reported_by: str | None = None,
) -> AlertBase:
    return AlertBase(
        type_code=type_code,
        severity=severity,
        zone_id=zone.id,
        source_id=source.id,
        confidence=confidence,
        detected_ago=detected_ago,
        template=rng.randrange(1000),
        minutes=rng.randint(5, 20),
        people=rng.randint(40, 120),
        reported_by=reported_by,
    )


def plan_confirmed_lifecycle(
    rng: random.Random,
    type_code: str,
    severity: Severity,
    initial_team: str,
    escalate: bool,
    actor: str,
) -> IncidentLifecycle:
    """Ciclo completo y resuelto: respuesta de 1-8 min (crítica 1-3) y resolución de 15-120 min (45-180 si
    se escala), medida desde la detección."""
    review = _minutes(rng, 1, 3) if severity == Severity.CRITICA else _minutes(rng, 1, 8)
    confirm = review + _minutes(rng, 0.5, 3)
    assign = confirm + _minutes(rng, 0.5, 2)
    start = assign + _minutes(rng, 0.5, 3)
    resolve = _minutes(rng, 45, 180) if escalate else _minutes(rng, 15, 120)
    escalate_step: TeamStep | None = None
    reason: str | None = None
    if escalate:
        team = ESCALATION_TEAM[type_code]
        escalate_at = start + _minutes(rng, 3, 15)
        escalate_step = TeamStep(team, TEAM_NAMES[team], escalate_at)
        reason = rng.choice(ESCALATION_REASONS[team])
        resolve = max(resolve, escalate_at + _minutes(rng, 20, 40))
    resolve = max(resolve, start + _minutes(rng, 5, 12))
    return IncidentLifecycle(
        actor_id=actor,
        review=review,
        confirm=confirm,
        assign=TeamStep(initial_team, TEAM_NAMES[initial_team], assign),
        start=start,
        escalate=escalate_step,
        escalate_reason=reason,
        resolve=resolve,
        resolution_note=rng.choice(RESOLUTION_NOTES[type_code]),
    )


def initial_team_for(type_code: str, zone_id: str) -> str:
    """Primer equipo asignado según el tipo y la zona."""
    if zone_id == "T1-PLATAFORMA":
        return "patrulla"
    if type_code == "concentracion_personas":
        return "operaciones"
    return "seg-t1"


def _confidence(rng: random.Random, type_code: str, confirmed: bool) -> float:
    threshold = THRESHOLDS[type_code]
    if confirmed:
        return round(rng.uniform(max(threshold, 0.70), 0.97), 2)
    return round(rng.uniform(threshold, min(threshold + 0.15, 0.90)), 2)


def plan_history(now: datetime, zones: Sequence[Zone], sources: Sequence[Source]) -> list[PlannedAlert]:
    rng = random.Random(SEED)
    catalog = _Catalog(zones={z.id: z for z in zones}, sources=list(sources))
    detections = _detections(rng, now)
    total = len(detections)

    confirmed_count = round(total * CONFIRMED_RATIO)
    confirmed_idx = set(rng.sample(range(total), confirmed_count))
    severities: list[Severity] = []
    for severity, share in SEVERITY_SHARE:
        severities.extend([severity] * round(confirmed_count * share))
    severities = (severities + [Severity.MEDIA] * confirmed_count)[:confirmed_count]
    rng.shuffle(severities)
    escalated_slots = set(rng.sample(range(confirmed_count), round(confirmed_count * ESCALATED_RATIO)))
    manual_slots = set(rng.sample(range(confirmed_count), round(confirmed_count * MANUAL_RATIO)))
    manual_sources = [s for s in sources if s.kind == SourceKind.REPORTE_MANUAL]

    plans: list[PlannedAlert] = []
    slot = 0
    for index, detected_at in enumerate(detections):
        detected_ago = now - detected_at.astimezone(now.tzinfo)
        actor = _actor(rng)
        if index in confirmed_idx:
            severity = severities[slot]
            escalate = slot in escalated_slots
            manual = slot in manual_slots and severity in {Severity.ALTA, Severity.MEDIA} and manual_sources
            slot += 1
            if manual:
                type_code = "reporte_operador"
                zone, _ = _pick_zone_and_source(rng, "comportamiento_anomalo", catalog)
                base = _base(rng, type_code, severity, zone, manual_sources[0], None, detected_ago, actor)
            else:
                type_code, zone, source = _confirmed_type(rng, severity, catalog)
                confidence = _confidence(rng, type_code, confirmed=True)
                base = _base(rng, type_code, severity, zone, source, confidence, detected_ago)
            life = plan_confirmed_lifecycle(
                rng, type_code, severity, initial_team_for(type_code, zone.id), escalate, actor
            )
            plans.append(plan_confirmed(base, life))
        else:
            names, weights = zip(*DISMISSED_TYPE_WEIGHTS, strict=True)
            type_code = rng.choices(names, weights=weights)[0]
            zone, source = _pick_zone_and_source(rng, type_code, catalog)
            severity = DEFAULT_SEVERITY[type_code]
            if zone.restricted and severity != Severity.CRITICA:
                severity = Severity.CRITICA if severity == Severity.ALTA else Severity.ALTA
            confidence = _confidence(rng, type_code, confirmed=False)
            base = _base(rng, type_code, severity, zone, source, confidence, detected_ago)
            reasons, reason_weights, _ = zip(*DISMISS_REASONS, strict=True)
            reason = rng.choices(reasons, weights=reason_weights)[0]
            comments = next(c for r, _, c in DISMISS_REASONS if r == reason)
            review = _minutes(rng, 1, 8)
            plans.append(
                plan_dismissed(
                    base, actor, review, review + _minutes(rng, 0.5, 4), reason.value, rng.choice(comments)
                )
            )
    return plans
