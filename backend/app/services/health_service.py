"""Caso de uso: estado de salud de la API, la base de datos y el simulador."""

import logging
from dataclasses import dataclass
from typing import Literal

from sqlmodel import Session

from app.config import APP_VERSION
from app.domain.catalogs import DEFAULT_SIMULATOR_ENABLED, DEFAULT_SIMULATOR_INTERVAL_SECONDS
from app.repositories.settings_repo import SettingsRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SimulatorStatus:
    enabled: bool
    interval_seconds: int
    running: bool


@dataclass(frozen=True)
class HealthStatus:
    status: Literal["ok"]
    db: Literal["ok", "error"]
    version: str
    simulator: SimulatorStatus


class HealthService:
    def __init__(self, session: Session) -> None:
        self.settings = SettingsRepository(session)

    def check(self) -> HealthStatus:
        db_state: Literal["ok", "error"] = "ok"
        enabled = DEFAULT_SIMULATOR_ENABLED
        interval = DEFAULT_SIMULATOR_INTERVAL_SECONDS
        try:
            self.settings.ping()
            stored_enabled = self.settings.get("simulator.enabled")
            stored_interval = self.settings.get("simulator.interval_seconds")
            if stored_enabled is not None:
                enabled = bool(stored_enabled)
            if stored_interval is not None:
                interval = int(stored_interval)
        except Exception:
            logger.exception("La comprobación de salud de la base de datos falló")
            db_state = "error"
        # `running` pasa a reflejar el simulador real en la feature 003.
        return HealthStatus(
            status="ok",
            db=db_state,
            version=APP_VERSION,
            simulator=SimulatorStatus(enabled=enabled, interval_seconds=interval, running=False),
        )
