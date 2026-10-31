"""DTOs de la configuración y del reinicio de la demo (specs/008-configuracion-demo/contracts/)."""

from datetime import datetime

from app.api.schemas.base import ApiModel
from app.services.ports import ResetResult
from app.services.settings_service import SettingsUpdate, SettingsView


class SimulatorSettingsOut(ApiModel):
    enabled: bool
    interval_seconds: int
    running: bool
    next_run_at: datetime | None


class SettingsOut(ApiModel):
    simulator: SimulatorSettingsOut
    thresholds: dict[str, float]
    below_threshold: int

    @classmethod
    def from_view(cls, view: SettingsView) -> "SettingsOut":
        sim = view.simulator
        return cls(
            simulator=SimulatorSettingsOut(
                enabled=sim.enabled,
                interval_seconds=sim.interval_seconds,
                running=sim.running,
                next_run_at=sim.next_run_at,
            ),
            thresholds=dict(view.thresholds),
            below_threshold=view.below_threshold,
        )


class SimulatorSettingsIn(ApiModel):
    """Campos editables del simulador; `running` y `nextRunAt` son de solo lectura y se ignoran."""

    enabled: bool | None = None
    interval_seconds: int | None = None


class SettingsIn(ApiModel):
    """Cuerpo parcial del PUT: solo se cambian los campos presentes."""

    simulator: SimulatorSettingsIn | None = None
    thresholds: dict[str, float] | None = None

    def to_update(self) -> SettingsUpdate:
        simulator = self.simulator or SimulatorSettingsIn()
        return SettingsUpdate(
            simulator_enabled=simulator.enabled,
            simulator_interval_seconds=simulator.interval_seconds,
            thresholds=dict(self.thresholds or {}),
        )


class ResetOut(ApiModel):
    alerts: int
    incidents: int
    reset_at: datetime

    @classmethod
    def from_result(cls, result: ResetResult) -> "ResetOut":
        return cls(alerts=result.alerts, incidents=result.incidents, reset_at=result.reset_at)
