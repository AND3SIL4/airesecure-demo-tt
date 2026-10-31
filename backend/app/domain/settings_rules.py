"""Reglas de la configuración de la demo (doc 05 §4.2, spec 008 R1): intervalo del simulador y umbrales."""

from collections.abc import Mapping

from app.domain.alert_rules import FieldError

INTERVAL_MIN_SECONDS = 15
INTERVAL_MAX_SECONDS = 300
THRESHOLD_MIN = 0.50
THRESHOLD_MAX = 0.99
THRESHOLD_DECIMALS = 2

INTERVAL_FIELD = "simulator.intervalSeconds"
THRESHOLD_FIELD_PREFIX = "thresholds."


def validate_interval(seconds: int | None) -> list[FieldError]:
    """El intervalo es un entero entre 15 y 300 segundos (None = sin cambio)."""
    if seconds is None:
        return []
    if not INTERVAL_MIN_SECONDS <= seconds <= INTERVAL_MAX_SECONDS:
        return [
            {
                "field": INTERVAL_FIELD,
                "message": f"Debe estar entre {INTERVAL_MIN_SECONDS} y {INTERVAL_MAX_SECONDS} segundos.",
            }
        ]
    return []


def validate_thresholds(
    changes: Mapping[str, float], default_thresholds: Mapping[str, float | None]
) -> list[FieldError]:
    """Cada tipo debe existir en el catálogo (`default_thresholds`: código → umbral por defecto, None si el
    tipo no usa umbral) y su valor estar entre 0,50 y 0,99."""
    errors: list[FieldError] = []
    for code, value in changes.items():
        field = f"{THRESHOLD_FIELD_PREFIX}{code}"
        if code not in default_thresholds:
            errors.append({"field": field, "message": "El tipo de alerta no existe."})
        elif default_thresholds[code] is None:
            errors.append({"field": field, "message": "Este tipo de alerta no usa umbral de confianza."})
        elif not THRESHOLD_MIN <= value <= THRESHOLD_MAX:
            errors.append(
                {"field": field, "message": f"Debe estar entre {_es(THRESHOLD_MIN)} y {_es(THRESHOLD_MAX)}."}
            )
    return errors


def normalize_threshold(value: float) -> float:
    """Los umbrales se guardan con 2 decimales."""
    return round(value, THRESHOLD_DECIMALS)


def _es(value: float) -> str:
    """Número con 2 decimales y coma decimal (es-CO)."""
    return f"{value:.2f}".replace(".", ",")
