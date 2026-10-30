"""Constantes de dominio no persistidas (doc 05 §4-5) y helpers puros."""

from datetime import UTC, datetime
from typing import TypedDict

from app.domain.enums import DismissReason, Severity

SEVERITY_WEIGHT: dict[Severity, float] = {
    Severity.CRITICA: 1.00,
    Severity.ALTA: 0.75,
    Severity.MEDIA: 0.50,
    Severity.BAJA: 0.25,
}

SEVERITY_ORDER: dict[Severity, int] = {
    Severity.CRITICA: 4,
    Severity.ALTA: 3,
    Severity.MEDIA: 2,
    Severity.BAJA: 1,
}

# Valores por defecto del simulador (doc 10); los usan la siembra y el estado de salud.
DEFAULT_SIMULATOR_ENABLED: bool = True
DEFAULT_SIMULATOR_INTERVAL_SECONDS: int = 60

# Factor de zona según su criticidad (1..3).
ZONE_FACTOR: dict[int, float] = {1: 0.60, 2: 0.80, 3: 1.00}


class DismissReasonLabel(TypedDict):
    label: str
    requires_text: bool


# Catálogo de motivos de descarte (doc 04 §2, doc 05 §4.3).
DISMISS_REASON_LABELS: dict[DismissReason, DismissReasonLabel] = {
    DismissReason.PERTENENCIA_PERSONAL: {
        "label": "Objeto identificado como pertenencia del personal",
        "requires_text": False,
    },
    DismissReason.MOVIMIENTO_NORMAL: {"label": "Movimiento normal de pasajeros", "requires_text": False},
    DismissReason.FALLA_CAMARA: {
        "label": "Falla, reflejo u obstrucción de la cámara",
        "requires_text": False,
    },
    DismissReason.PERSONAL_AUTORIZADO: {"label": "Personal autorizado en la zona", "requires_text": False},
    DismissReason.OTRO: {"label": "Otro", "requires_text": True},
}


def utcnow() -> datetime:
    """Fecha y hora actual en UTC con zona horaria."""
    return datetime.now(UTC)
