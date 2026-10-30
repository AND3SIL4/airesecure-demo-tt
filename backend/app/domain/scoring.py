"""Score de prioridad explicable (doc 05 §5): round(100 × w_sev × confianza × f_zona)."""

import json
from dataclasses import dataclass
from typing import Any

from app.domain.catalogs import SEVERITY_ORDER, SEVERITY_WEIGHT, ZONE_FACTOR
from app.domain.enums import Severity

MANUAL_CONFIDENCE: float = 1.0


@dataclass(frozen=True)
class ScoreBreakdown:
    severity_weight: float
    confidence: float
    zone_factor: float
    zone_criticality: int
    score: int
    manual: bool

    def to_dict(self) -> dict[str, Any]:
        return {
            "severityWeight": self.severity_weight,
            "confidence": self.confidence,
            "zoneFactor": self.zone_factor,
            "zoneCriticality": self.zone_criticality,
            "score": self.score,
            "manual": self.manual,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, raw: str) -> "ScoreBreakdown":
        data: dict[str, Any] = json.loads(raw)
        return cls(
            severity_weight=float(data["severityWeight"]),
            confidence=float(data["confidence"]),
            zone_factor=float(data["zoneFactor"]),
            zone_criticality=int(data["zoneCriticality"]),
            score=int(data["score"]),
            manual=bool(data.get("manual", False)),
        )


def compute_score(severity: Severity, confidence: float | None, zone_criticality: int) -> ScoreBreakdown:
    """Calcula el score; sin confianza (reporte humano) se usa 1.0 y se marca como manual."""
    manual = confidence is None
    conf = MANUAL_CONFIDENCE if confidence is None else confidence
    weight = SEVERITY_WEIGHT[severity]
    factor = ZONE_FACTOR[zone_criticality]
    score = round(100 * weight * conf * factor)
    return ScoreBreakdown(
        severity_weight=weight,
        confidence=conf,
        zone_factor=factor,
        zone_criticality=zone_criticality,
        score=max(0, min(100, score)),
        manual=manual,
    )


def elevate_severity(severity: Severity, restricted: bool) -> Severity:
    """Sube un nivel la severidad si la zona es restringida, con tope en `critica`."""
    if not restricted:
        return severity
    target = min(SEVERITY_ORDER[severity] + 1, max(SEVERITY_ORDER.values()))
    return next(sev for sev, order in SEVERITY_ORDER.items() if order == target)
