"""Detección de anomalías basada en reglas, demostrativa (doc 05 §7, research R3 de 005). Funciones puras."""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal

AnomalyScope = Literal["zone", "type"]

WEEK_HOURS = 168
MIN_BASELINE = 1.0
MIN_COUNT = 5  # ajustado para la demo: evita avisos con 3-4 alertas casuales (doc 05 §7)
FACTOR = 1.5


@dataclass(frozen=True)
class Anomaly:
    scope: AnomalyScope
    key: str
    label: str
    last_hour: int
    hourly_mean: float  # referencia = max(media horaria de 7 días, mínimo)
    variation_pct: float


def anomaly_label(name: str) -> str:
    return f"Aumento inusual · {name}"


def detect(
    scope: AnomalyScope,
    recent_counts: Mapping[str, int],
    weekly_counts: Mapping[str, int],
    names: Mapping[str, str],
    hours: int = WEEK_HOURS,
    min_baseline: float = MIN_BASELINE,
    min_count: int = MIN_COUNT,
    factor: float = FACTOR,
) -> list[Anomaly]:
    """Anomalía si `conteo ≥ min_count` y `conteo ≥ factor × referencia`; `referencia = max(media, mínimo)`.

    `recent_counts`: alertas de los últimos 60 min por clave; `weekly_counts`: de los últimos 7 días.
    Devuelve las anomalías ordenadas por variación descendente.
    """
    found: list[Anomaly] = []
    for key, count in recent_counts.items():
        baseline = max(weekly_counts.get(key, 0) / hours, min_baseline)
        if count < min_count or count < factor * baseline:
            continue
        found.append(
            Anomaly(
                scope=scope,
                key=key,
                label=anomaly_label(names.get(key, key)),
                last_hour=count,
                hourly_mean=round(baseline, 2),
                variation_pct=round((count / baseline - 1) * 100, 1),
            )
        )
    return sorted(found, key=lambda a: (-a.variation_pct, a.key))
