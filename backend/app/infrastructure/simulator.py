"""Simulador de eventos (doc 10 §7, research R5 de 003): tarea asyncio iniciada en el lifespan.

Las reglas de generación viven en `domain/simulation.py` y el caso de uso en `AlertService.simulate_event`;
aquí solo se programa la ejecución. Cada acceso a la base de datos corre en un hilo (`asyncio.to_thread`)
con una `Session` propia, para no bloquear el event loop.
"""

import asyncio
import contextlib
import logging
import random
import time

from sqlalchemy import Engine
from sqlmodel import Session

from app.domain.simulation import next_delay
from app.services.alert_service import AlertService, SimulatorSettings
from app.services.ports import EventPublisher

logger = logging.getLogger(__name__)

DISABLED_POLL_SECONDS = 5.0
# Cada cuánto se relee la configuración mientras se espera el próximo evento (cambios en caliente).
SETTINGS_POLL_SECONDS = 5.0
ERROR_BACKOFF_SECONDS = 5.0


class Simulator:
    def __init__(self, engine: Engine, publisher: EventPublisher) -> None:
        self._engine = engine
        self._publisher = publisher
        self._rng = random.Random()
        self._task: asyncio.Task[None] | None = None

    @property
    def running(self) -> bool:
        return self._task is not None and not self._task.done()

    def start(self) -> None:
        """Arranca el bucle en el event loop actual (idempotente)."""
        if self.running:
            return
        self._task = asyncio.create_task(self._run(), name="aerosecure-simulator")

    async def stop(self) -> None:
        """Cancela el bucle y espera a que termine (un tick en curso en su hilo termina por su cuenta)."""
        task = self._task
        self._task = None
        if task is None or task.done():
            return
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    # ---------- Bucle ----------

    async def _run(self) -> None:
        logger.info("Simulador iniciado")
        try:
            while True:
                try:
                    settings = await asyncio.to_thread(self._read_settings)
                except Exception:
                    logger.exception("El simulador no pudo leer su configuración")
                    await asyncio.sleep(ERROR_BACKOFF_SECONDS)
                    continue
                if not settings.enabled:
                    await asyncio.sleep(DISABLED_POLL_SECONDS)
                    continue
                if not await self._wait_next(settings):
                    continue  # la configuración cambió durante la espera: se reprograma
                try:
                    await asyncio.to_thread(self._tick)
                except Exception:
                    logger.exception("Falló un ciclo del simulador; se reintenta en el próximo")
        finally:
            logger.info("Simulador detenido")

    async def _wait_next(self, settings: SimulatorSettings) -> bool:
        """Espera el próximo evento releyendo la configuración cada pocos segundos. Devuelve False si se
        desactivó o cambió el intervalo (hay que reprogramar)."""
        due = time.monotonic() + next_delay(self._rng, settings.interval_seconds)
        while (remaining := due - time.monotonic()) > 0:
            await asyncio.sleep(min(SETTINGS_POLL_SECONDS, remaining))
            if due - time.monotonic() <= 0:
                break
            try:
                current = await asyncio.to_thread(self._read_settings)
            except Exception:
                logger.exception("El simulador no pudo leer su configuración")
                continue
            if current != settings:
                return False
        return True

    def _read_settings(self) -> SimulatorSettings:
        with Session(self._engine) as session:
            return AlertService(session).simulator_settings()

    def _tick(self) -> None:
        with Session(self._engine) as session:
            service = AlertService(session, self._publisher)
            if not service.simulator_settings().enabled:
                return
            alert = service.simulate_event(self._rng)
            if alert is None:
                logger.debug("Evento simulado bajo el umbral: descartado")
            else:
                logger.info("Alerta simulada %s creada", alert.id)
