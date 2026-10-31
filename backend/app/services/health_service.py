"""Caso de uso: estado de salud de la API, la base de datos y el simulador."""

import logging
from dataclasses import dataclass
from typing import Literal

from sqlmodel import Session

from app.config import APP_VERSION
from app.domain.catalogs import (
    DEFAULT_SIMULATOR_ENABLED,
    DEFAULT_SIMULATOR_INTERVAL_SECONDS,
    SETTING_BELOW_THRESHOLD,
    SETTING_SIMULATOR_ENABLED,
    SETTING_SIMULATOR_INTERVAL,
)
from app.repositories.settings_repo import SettingsRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SimulatorStatus:
    enabled: bool
    interval_seconds: int
    running: bool
    below_threshold: int


@dataclass(frozen=True)
class HealthStatus:
    status: Literal["ok"]
    db: Literal["ok", "error"]
    version: str
    simulator: SimulatorStatus


class HealthService:
    def __init__(self, session: Session) -> None:
        self.settings = SettingsRepository(session)

    def check(self, simulator_running: bool) -> HealthStatus:
        """`simulator_running` lo aporta quien conoce el simulador real (la capa api, vía app.state)."""
        db_state: Literal["ok", "error"] = "ok"
        enabled = DEFAULT_SIMULATOR_ENABLED
        interval = DEFAULT_SIMULATOR_INTERVAL_SECONDS
        below_threshold = 0
        try:
            self.settings.ping()
            stored_enabled = self.settings.get(SETTING_SIMULATOR_ENABLED)
            if stored_enabled is not None:
                enabled = bool(stored_enabled)
            interval = self.settings.get_int(SETTING_SIMULATOR_INTERVAL, DEFAULT_SIMULATOR_INTERVAL_SECONDS)
            below_threshold = self.settings.get_int(SETTING_BELOW_THRESHOLD, 0)
        except Exception:
            logger.exception("La comprobación de salud de la base de datos falló")
            db_state = "error"
        return HealthStatus(
            status="ok",
            db=db_state,
            version=APP_VERSION,
            simulator=SimulatorStatus(
                enabled=enabled,
                interval_seconds=interval,
                # En ejecución = tarea viva **y** habilitado en la configuración (spec 003, US2-5).
                running=simulator_running and enabled,
                below_threshold=below_threshold,
            ),
        )
