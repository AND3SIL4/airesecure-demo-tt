"""Planificación de los incidentes de hoy (doc 10 §4):

- 6 incidentes resueltos hoy, con la resolución repartida entre las 00:00 (hora de Bogotá) y hace 1 h.
- 3 en curso: abierto sin equipo (hace 20 min), en atención con Seguridad T1 (hace 35 min) y escalado a la
  Policía aeroportuaria (hace 50 min). Los minutos indican la apertura del incidente.
"""

import random
from dataclasses import dataclass
from datetime import datetime, time, timedelta

from app.domain.enums import Severity
from app.domain.time import BOGOTA_TZ
from app.infrastructure.seed.history import TEAM_NAMES, plan_confirmed_lifecycle
from app.infrastructure.seed.plan import (
    AlertBase,
    IncidentLifecycle,
    PlannedAlert,
    TeamStep,
    plan_confirmed,
)

SEED = 4096
RESOLVED_TODAY = 6
MIN_WINDOW = timedelta(minutes=40)


@dataclass(frozen=True)
class _Resolved:
    type_code: str
    severity: Severity
    zone_id: str
    source_id: str
    confidence: float
    team_id: str
    actor: str
    template: int


# Incidentes resueltos hoy (variedad de tipos y zonas; ninguno de concentración en la Sala de embarque A
# para no alterar la anomalía sembrada de la última hora).
_RESOLVED: list[_Resolved] = [
    _Resolved("equipaje_abandonado", Severity.CRITICA, "T1-EQUIPAJES", "CAM-T1-012", 0.92,
              "seg-t1", "op-01", 0),
    _Resolved("objeto_inusual", Severity.ALTA, "T1-SEGURIDAD", "CAM-T1-004", 0.81,
              "seg-t1", "op-02", 1),
    _Resolved("comportamiento_anomalo", Severity.MEDIA, "T1-HALL", "CAM-T1-001", 0.71,
              "seg-t1", "op-01", 2),
    _Resolved("concentracion_personas", Severity.MEDIA, "T1-CHECKIN", "CAM-T1-003", 0.77,
              "operaciones", "op-02", 0),
    _Resolved("permanencia_inusual", Severity.BAJA, "T1-COMERCIAL", "CAM-T1-014", 0.66,
              "seg-t1", "sup-a", 1),
    _Resolved("acceso_restringido", Severity.ALTA, "T1-PLATAFORMA", "SEN-T1-005", 0.84,
              "patrulla", "op-01", 1),
]  # fmt: skip


def _resolved_plans(now: datetime, rng: random.Random) -> list[PlannedAlert]:
    midnight = datetime.combine(now.astimezone(BOGOTA_TZ).date(), time(0, 0), tzinfo=BOGOTA_TZ)
    window_end = now - timedelta(hours=1)
    if window_end - midnight < MIN_WINDOW:  # demo recién pasada la medianoche: se usa lo disponible
        window_end = now - timedelta(minutes=2)
    window = max(window_end - midnight, timedelta(minutes=1))
    plans: list[PlannedAlert] = []
    for index, spec in enumerate(_RESOLVED):
        life = plan_confirmed_lifecycle(rng, spec.type_code, spec.severity, spec.team_id, False, spec.actor)
        assert life.resolve is not None
        # Resoluciones repartidas en la ventana (00:00 → hace 1 h).
        resolved_at = midnight + window * (index + 0.5 + rng.uniform(-0.3, 0.3)) / RESOLVED_TODAY
        earliest = midnight + life.resolve + timedelta(minutes=1)  # la detección también es de hoy
        if earliest < window_end:
            resolved_at = max(resolved_at, earliest)
        detected_at = resolved_at - life.resolve
        base = AlertBase(
            type_code=spec.type_code,
            severity=spec.severity,
            zone_id=spec.zone_id,
            source_id=spec.source_id,
            confidence=spec.confidence,
            detected_ago=now - detected_at,
            template=spec.template,
            minutes=rng.randint(5, 20),
            people=rng.randint(40, 120),
        )
        plans.append(plan_confirmed(base, life))
    return plans


def _min(minutes: float) -> timedelta:
    return timedelta(seconds=round(minutes * 60))


def _in_course_plans() -> list[PlannedAlert]:
    """Los 3 en curso del doc 10 §4 (la apertura es la confirmación de la alerta)."""
    opened_ago = {"abierto": 20, "en_atencion": 35, "escalado": 50}
    open_base = AlertBase(
        "objeto_inusual", Severity.ALTA, "T1-PUERTAS", "CAM-T1-011", 0.82,
        _min(opened_ago["abierto"] + 4), template=2,
    )  # fmt: skip
    open_life = IncidentLifecycle(actor_id="op-01", review=_min(2), confirm=_min(4))

    attending_base = AlertBase(
        "comportamiento_anomalo", Severity.MEDIA, "T1-SEGURIDAD", "CAM-T1-004", 0.73,
        _min(opened_ago["en_atencion"] + 6), template=1, minutes=12,
    )  # fmt: skip
    attending_life = IncidentLifecycle(
        actor_id="op-02",
        review=_min(3),
        confirm=_min(6),
        assign=TeamStep("seg-t1", TEAM_NAMES["seg-t1"], _min(7)),
        start=_min(9),
    )

    escalated_base = AlertBase(
        "acceso_restringido", Severity.ALTA, "T1-SERVICIO", "SEN-T1-003", 0.88,
        _min(opened_ago["escalado"] + 3), template=1,
    )  # fmt: skip
    escalated_life = IncidentLifecycle(
        actor_id="op-01",
        review=_min(1.5),
        confirm=_min(3),
        assign=TeamStep("seg-t1", TEAM_NAMES["seg-t1"], _min(4)),
        start=_min(6),
        escalate=TeamStep("policia", TEAM_NAMES["policia"], _min(18)),
        escalate_reason="Persona sin credencial válida en la puerta de servicio; se requiere apoyo policial.",
    )
    return [
        plan_confirmed(open_base, open_life),
        plan_confirmed(attending_base, attending_life),
        plan_confirmed(escalated_base, escalated_life),
    ]


def plan_today_incidents(now: datetime) -> list[PlannedAlert]:
    rng = random.Random(SEED)
    return _resolved_plans(now, rng) + _in_course_plans()
