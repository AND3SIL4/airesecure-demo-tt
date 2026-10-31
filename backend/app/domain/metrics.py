"""Variación frente a ayer de un KPI (doc 05 §6, research R2 de 005). Funciones puras."""

from dataclasses import dataclass
from typing import Literal

DeltaKind = Literal["pct", "abs", "none"]


@dataclass(frozen=True)
class Delta:
    """`value` es el valor de hoy en la ventana comparable y `previous` el de ayer.

    `pct` solo con `kind == "pct"` y `diff` solo con `kind == "abs"`.
    """

    value: int | float | None
    previous: int | float | None
    kind: DeltaKind
    pct: float | None = None
    diff: int | float | None = None


def delta(today: int | float | None, yesterday: int | float | None) -> Delta:
    """Sin dato de hoy o de ayer → "none" ("Sin datos de ayer"); ayer = 0 → diferencia absoluta; si no, %."""
    if today is None or yesterday is None:
        return Delta(value=today, previous=yesterday, kind="none")
    if yesterday == 0:
        return Delta(value=today, previous=yesterday, kind="abs", diff=today - yesterday)
    pct = round((today - yesterday) / yesterday * 100, 1)
    return Delta(value=today, previous=yesterday, kind="pct", pct=pct)
