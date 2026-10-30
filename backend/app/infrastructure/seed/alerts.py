"""Siembra de alertas relativa a "ahora" (doc 10 §4 y specs/002-alertas/data-model.md §Datos semilla).

- Las 12 alertas activas del doc 10 §4.
- 3 descartadas de hoy (hace 5, 3 y 2 h) y 3 descartadas de concentración en T1-EMBARQUE-A (anomalía).
Se insertan en orden cronológico para que los IDs crezcan con el tiempo, y solo si no hay alertas.
"""

import json
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlmodel import Session, func, select

from app.domain.enums import AlertOrigin, AlertStatus, DismissReason, Severity, TimelineAction
from app.domain.ids import ALERT_FIRST_NUMBER, format_alert_id
from app.domain.models import Alert, AlertType, Source, TimelineEvent, Zone
from app.domain.scoring import compute_score
from app.infrastructure.seed.texts import render


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


def _event(
    alert_id: str,
    action: TimelineAction,
    at: datetime,
    actor: str | None,
    from_status: AlertStatus | None = None,
    to_status: AlertStatus | None = None,
    comment: str | None = None,
    payload: dict[str, str] | None = None,
) -> TimelineEvent:
    return TimelineEvent(
        alert_id=alert_id,
        actor_id=actor,
        action=action,
        from_status=from_status.value if from_status else None,
        to_status=to_status.value if to_status else None,
        comment=comment,
        payload_json=json.dumps(payload) if payload else None,
        created_at=at,
    )


def _insert(session: Session, alert_id: str, spec: _SeedAlert, now: datetime) -> None:
    alert_type = session.get(AlertType, spec.type_code)
    zone = session.get(Zone, spec.zone_id)
    source = session.get(Source, spec.source_id)
    if alert_type is None or zone is None or source is None:
        raise RuntimeError(f"Catálogo incompleto para sembrar {spec.type_code} en {spec.zone_id}")

    detected_at = now - timedelta(minutes=spec.minutes_ago)
    breakdown = compute_score(spec.severity, spec.confidence, zone.criticality)
    alert = Alert(
        id=alert_id,
        type_code=spec.type_code,
        zone_id=spec.zone_id,
        source_id=spec.source_id,
        severity=spec.severity,
        status=spec.status,
        origin=AlertOrigin.MANUAL if spec.reported_by else AlertOrigin.SEED,
        detected_at=detected_at,
        confidence=spec.confidence,
        score=breakdown.score,
        score_breakdown_json=breakdown.to_json(),
        description=render(
            spec.type_code,
            spec.template,
            zona=zone.name,
            fuente=source.label,
            min=max(spec.minutes_ago, 5),
            n=spec.n,
        ),
        recommendation=alert_type.recommendation,
        evidence_key=spec.type_code,
        reported_by=spec.reported_by,
    )
    events = [
        _event(alert_id, TimelineAction.CREATED, detected_at, spec.reported_by, None, AlertStatus.NUEVA)
    ]

    if spec.reviewer is not None:
        reviewed_at = detected_at + timedelta(minutes=spec.review_after_min)
        alert.reviewed_by = spec.reviewer
        alert.first_action_at = reviewed_at
        events.append(
            _event(alert_id, TimelineAction.REVIEW, reviewed_at, spec.reviewer,
                   AlertStatus.NUEVA, AlertStatus.EN_REVISION)
        )  # fmt: skip

    if spec.dismissal is not None:
        d = spec.dismissal
        reviewed_at = detected_at + timedelta(minutes=d.review_after_min)
        dismissed_at = detected_at + timedelta(minutes=d.dismiss_after_min)
        alert.reviewed_by = d.actor
        alert.first_action_at = reviewed_at
        alert.closed_at = dismissed_at
        alert.dismiss_reason = d.reason.value
        alert.dismiss_comment = d.comment
        events.append(
            _event(alert_id, TimelineAction.REVIEW, reviewed_at, d.actor,
                   AlertStatus.NUEVA, AlertStatus.EN_REVISION)
        )  # fmt: skip
        events.append(
            _event(alert_id, TimelineAction.DISMISS, dismissed_at, d.actor,
                   AlertStatus.EN_REVISION, AlertStatus.DESCARTADA, d.comment, {"reason": d.reason.value})
        )  # fmt: skip

    session.add(alert)
    session.flush()  # los eventos dependen de la alerta (FK)
    for event in events:
        session.add(event)
    session.flush()


def seed_alerts(session: Session, now: datetime) -> int:
    """Siembra las alertas de hoy si la tabla está vacía. Devuelve cuántas se insertaron."""
    existing = session.exec(select(func.count()).select_from(Alert)).one()
    if existing > 0:
        return 0
    # Tabla vacía: los IDs se asignan localmente en orden cronológico (ALT-2001, ALT-2002, ...).
    specs = sorted(_ACTIVE + _DISMISSED, key=lambda s: s.minutes_ago, reverse=True)
    for offset, spec in enumerate(specs):
        _insert(session, format_alert_id(ALERT_FIRST_NUMBER + offset), spec, now)
    session.commit()
    return len(specs)
