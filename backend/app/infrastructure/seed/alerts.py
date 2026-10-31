"""Planificación de las alertas de hoy (doc 10 §4 y specs/002-alertas/data-model.md §Datos semilla).

- Las 12 alertas activas del doc 10 §4.
- 3 descartadas de hoy (hace 5, 3 y 2 h) y 3 descartadas de concentración en T1-EMBARQUE-A (anomalía).
Devuelve planes (`PlannedAlert`); `plan.materialize` asigna los IDs en orden cronológico global.
"""

from dataclasses import dataclass
from datetime import timedelta

from app.domain.enums import AlertStatus, DismissReason, Severity
from app.infrastructure.seed.plan import AlertBase, PlannedAlert, plan_dismissed, plan_pending


@dataclass(frozen=True)
class _Dismissal:
    reason: DismissReason
    actor: str
    comment: str
    review_after_min: int
    dismiss_after_min: int


@dataclass(frozen=True)
class _SeedAlert:
    type_code: str
    severity: Severity
    status: AlertStatus
    zone_id: str
    source_id: str
    confidence: float | None
    minutes_ago: int
    template: int = 0
    n: int = 0
    reviewer: str | None = None
    review_after_min: int = 0
    reported_by: str | None = None
    dismissal: _Dismissal | None = None


# Doc 10 §4 "Alertas activas sembradas" (#1-#12). Revisores alternos op-01/op-02 en las en revisión.
_ACTIVE: list[_SeedAlert] = [
    _SeedAlert("equipaje_abandonado", Severity.CRITICA, AlertStatus.NUEVA, "T1-EQUIPAJES", "CAM-T1-012",
               0.94, 3, template=0),
    _SeedAlert("acceso_restringido", Severity.CRITICA, AlertStatus.EN_REVISION, "T1-PLATAFORMA",
               "SEN-T1-005", 0.91, 9, template=0, reviewer="op-01", review_after_min=2),
    _SeedAlert("concentracion_personas", Severity.MEDIA, AlertStatus.NUEVA, "T1-EMBARQUE-A", "CAM-T1-008",
               0.78, 6, template=0, n=85),
    _SeedAlert("concentracion_personas", Severity.MEDIA, AlertStatus.EN_REVISION, "T1-EMBARQUE-A",
               "CAM-T1-009", 0.72, 18, template=1, n=70, reviewer="op-02", review_after_min=1),
    _SeedAlert("objeto_inusual", Severity.ALTA, AlertStatus.NUEVA, "T1-SEGURIDAD", "CAM-T1-005",
               0.83, 12, template=0),
    _SeedAlert("comportamiento_anomalo", Severity.MEDIA, AlertStatus.NUEVA, "T1-MIGRACION", "CAM-T1-006",
               0.69, 22, template=0),
    _SeedAlert("acceso_restringido", Severity.ALTA, AlertStatus.EN_REVISION, "T1-SERVICIO", "SEN-T1-004",
               0.76, 27, template=2, reviewer="op-01", review_after_min=3),
    _SeedAlert("permanencia_inusual", Severity.BAJA, AlertStatus.NUEVA, "T1-COMERCIAL", "CAM-T1-014",
               0.64, 31, template=0),
    _SeedAlert("permanencia_inusual", Severity.BAJA, AlertStatus.NUEVA, "T1-HALL", "CAM-T1-001",
               0.61, 40, template=1),
    _SeedAlert("objeto_inusual", Severity.ALTA, AlertStatus.EN_REVISION, "T1-PUERTAS", "CAM-T1-010",
               0.80, 44, template=1, reviewer="op-02", review_after_min=2),
    _SeedAlert("reporte_operador", Severity.MEDIA, AlertStatus.NUEVA, "T1-CHECKIN", "MANUAL",
               None, 15, template=0, reported_by="op-02"),
    _SeedAlert("comportamiento_anomalo", Severity.MEDIA, AlertStatus.NUEVA, "T1-HALL", "CAM-T1-002",
               0.66, 55, template=1),
]  # fmt: skip

# Descartadas de hoy (data-model.md) y anomalía de concentración en T1-EMBARQUE-A (25, 38 y 52 min).
_DISMISSED: list[_SeedAlert] = [
    _SeedAlert("objeto_inusual", Severity.ALTA, AlertStatus.DESCARTADA, "T1-HALL", "CAM-T1-002",
               0.79, 300, template=2,
               dismissal=_Dismissal(DismissReason.PERTENENCIA_PERSONAL, "op-01",
                                    "Carro de limpieza del personal identificado en la cámara.", 2, 5)),
    _SeedAlert("comportamiento_anomalo", Severity.MEDIA, AlertStatus.DESCARTADA, "T1-CHECKIN", "CAM-T1-003",
               0.68, 180, template=2,
               dismissal=_Dismissal(DismissReason.MOVIMIENTO_NORMAL, "op-02",
                                    "Pasajeros buscando su mostrador; flujo normal.", 1, 4)),
    _SeedAlert("permanencia_inusual", Severity.BAJA, AlertStatus.DESCARTADA, "T1-COMERCIAL", "CAM-T1-014",
               0.62, 120, template=2,
               dismissal=_Dismissal(DismissReason.FALLA_CAMARA, "op-01",
                                    "Reflejo en la vitrina confundido con una persona.", 2, 6)),
    _SeedAlert("concentracion_personas", Severity.MEDIA, AlertStatus.DESCARTADA, "T1-EMBARQUE-A",
               "CAM-T1-008", 0.74, 52, template=2, n=90,
               dismissal=_Dismissal(DismissReason.MOVIMIENTO_NORMAL, "op-02",
                                    "Embarque de un vuelo en curso; ocupación esperada.", 1, 3)),
    _SeedAlert("concentracion_personas", Severity.MEDIA, AlertStatus.DESCARTADA, "T1-EMBARQUE-A",
               "CAM-T1-009", 0.66, 38, template=0, n=75,
               dismissal=_Dismissal(DismissReason.MOVIMIENTO_NORMAL, "op-01",
                                    "Cambio de puerta anunciado; los pasajeros se reubican.", 2, 4)),
    _SeedAlert("concentracion_personas", Severity.MEDIA, AlertStatus.DESCARTADA, "T1-EMBARQUE-A",
               "CAM-T1-008", 0.70, 25, template=1, n=80,
               dismissal=_Dismissal(DismissReason.MOVIMIENTO_NORMAL, "op-02",
                                    "Fila de embarque ordenada; sin riesgo.", 1, 3)),
]  # fmt: skip


def _base(spec: _SeedAlert) -> AlertBase:
    return AlertBase(
        type_code=spec.type_code,
        severity=spec.severity,
        zone_id=spec.zone_id,
        source_id=spec.source_id,
        confidence=spec.confidence,
        detected_ago=timedelta(minutes=spec.minutes_ago),
        template=spec.template,
        minutes=max(spec.minutes_ago, 5),
        people=spec.n,
        reported_by=spec.reported_by,
    )


def _plan(spec: _SeedAlert) -> PlannedAlert:
    base = _base(spec)
    if spec.dismissal is not None:
        d = spec.dismissal
        return plan_dismissed(
            base,
            d.actor,
            timedelta(minutes=d.review_after_min),
            timedelta(minutes=d.dismiss_after_min),
            d.reason.value,
            d.comment,
        )
    review = timedelta(minutes=spec.review_after_min) if spec.reviewer is not None else None
    return plan_pending(base, spec.reviewer, review)


def plan_today_alerts() -> list[PlannedAlert]:
    """Las 12 activas, las 3 descartadas de hoy y las 3 descartadas de la anomalía."""
    return [_plan(spec) for spec in _ACTIVE + _DISMISSED]
