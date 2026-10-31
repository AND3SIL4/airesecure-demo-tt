"""Simulador de eventos (doc 10 §7, research R5 de 003): tarea asyncio iniciada en el lifespan.

Las reglas de generación viven en `domain/simulation.py` y el caso de uso en `AlertService.simulate_event`;
aquí solo se programa la ejecución. Cada acceso a la base de datos corre en un hilo (`asyncio.to_thread`)
con una `Session` propia, para no bloquear el event loop.
"""

import asyncio
import contextlib
import logging
import random
import threading
import time
from datetime import datetime, timedelta

from sqlalchemy import Engine
from sqlmodel import Session

from app.domain.catalogs import utcnow
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
        self._tick_task: asyncio.Future[None] | None = None
        self._next_run_at: datetime | None = None
        self._paused = False
        self._resume_on_unpause = False
        # Programación vigente: hora monótona del próximo evento y configuración con la que se calculó.
        # `reschedule()` la reescribe desde otro hilo (PUT /settings), por eso va protegida con un lock.
        self._schedule_lock = threading.Lock()
        self._due: float | None = None
        self._scheduled_for: SimulatorSettings | None = None
        # Se incrementa en cada `reschedule()`: el bucle descarta lo que leyó antes de una reprogramación.
        self._generation = 0
        self._loop: asyncio.AbstractEventLoop | None = None
        self._wake: asyncio.Event | None = None

    @property
    def running(self) -> bool:
        return self._task is not None and not self._task.done()

    @property
    def paused(self) -> bool:
        return self._paused

    @property
    def next_run_at(self) -> datetime | None:
        """Hora (UTC) programada del próximo evento; None si está apagado, pausado o detenido."""
        return self._next_run_at if self.running else None

    def start(self) -> None:
        """Arranca el bucle en el event loop actual (idempotente; no hace nada mientras está pausado)."""
        if self.running or self._paused:
            return
        self._loop = asyncio.get_running_loop()
        self._wake = asyncio.Event()
        self._task = asyncio.create_task(self._run(), name="aerosecure-simulator")

    def reschedule(self, settings: SimulatorSettings) -> datetime | None:
        """Aplica de inmediato una configuración recién confirmada (PUT /settings) y devuelve el nuevo
        `next_run_at`. Se puede llamar desde cualquier hilo; despierta al bucle para que no espere al próximo
        sondeo. Si la configuración no cambió respecto a la programada, conserva la hora prevista."""
        if not self.running:
            return None
        with self._schedule_lock:
            self._generation += 1
            if not settings.enabled:
                self._clear_schedule()
            elif settings != self._scheduled_for or self._due is None:
                self._program(settings)
            next_run_at = self._next_run_at
        loop, wake = self._loop, self._wake
        if loop is not None and wake is not None and not loop.is_closed():
            loop.call_soon_threadsafe(wake.set)
        return next_run_at

    def _program(self, settings: SimulatorSettings) -> None:
        """Calcula la próxima hora de evento (llamar con `_schedule_lock` tomado)."""
        delay = next_delay(self._rng, settings.interval_seconds)
        self._due = time.monotonic() + delay
        self._scheduled_for = settings
        self._next_run_at = utcnow() + timedelta(seconds=delay)

    def _clear_schedule(self) -> None:
        self._due = None
        self._scheduled_for = None
        self._next_run_at = None

    async def stop(self) -> None:
        """Cancela el bucle y espera a que termine, incluido un tick en curso en su hilo."""
        task = self._task
        self._task = None
        with self._schedule_lock:
            self._clear_schedule()
        if task is not None and not task.done():
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
        await self._wait_tick()

    async def pause(self) -> None:
        """Detiene el bucle (reinicio de la demo) y espera a que termine un tick en curso, para que nada
        escriba en la base mientras tanto. `resume()` lo vuelve a arrancar si estaba en marcha."""
        if self._paused:
            return
        self._resume_on_unpause = self.running
        self._paused = True
        await self.stop()

    def resume(self) -> None:
        """Quita la pausa y reanuda el bucle si estaba en marcha al pausar. El bucle relee la configuración,
        así que si el simulador está apagado solo espera a que se encienda."""
        if not self._paused:
            return
        self._paused = False
        if self._resume_on_unpause:
            self.start()
        self._resume_on_unpause = False

    async def _wait_tick(self) -> None:
        tick = self._tick_task
        if tick is None:
            return
        with contextlib.suppress(Exception, asyncio.CancelledError):
            await tick
        self._tick_task = None

    # ---------- Bucle ----------

    async def _run(self) -> None:
        logger.info("Simulador iniciado")
        try:
            while True:
                generation = self._generation
                try:
                    settings = await asyncio.to_thread(self._read_settings)
                except Exception:
                    logger.exception("El simulador no pudo leer su configuración")
                    await asyncio.sleep(ERROR_BACKOFF_SECONDS)
                    continue
                if not settings.enabled:
                    with self._schedule_lock:
                        if self._generation == generation:
                            self._clear_schedule()
                    await self._sleep(DISABLED_POLL_SECONDS)
                    continue
                if not await self._wait_next(settings, generation):
                    continue  # la configuración cambió durante la espera: se reprograma
                with self._schedule_lock:
                    self._clear_schedule()
                # El tick corre en su hilo como una tarea propia: si el bucle se cancela (pausa o apagado),
                # `stop()` espera a que termine en lugar de dejarlo escribiendo en segundo plano.
                self._tick_task = asyncio.ensure_future(asyncio.to_thread(self._tick))
                try:
                    await asyncio.shield(self._tick_task)
                except asyncio.CancelledError:
                    raise
                except Exception:
                    logger.exception("Falló un ciclo del simulador; se reintenta en el próximo")
                self._tick_task = None
        finally:
            with self._schedule_lock:
                self._clear_schedule()
            logger.info("Simulador detenido")

    async def _sleep(self, seconds: float) -> bool:
        """Duerme hasta `seconds` o hasta que `reschedule()` despierte al bucle. Devuelve True si lo
        despertaron."""
        wake = self._wake
        if wake is None:
            await asyncio.sleep(seconds)
            return False
        try:
            await asyncio.wait_for(wake.wait(), timeout=seconds)
        except TimeoutError:
            return False
        wake.clear()
        return True

    async def _wait_next(self, settings: SimulatorSettings, generation: int) -> bool:
        """Espera el próximo evento releyendo la configuración cada pocos segundos. Devuelve False si se
        desactivó, cambió el intervalo o `reschedule()` reprogramó (hay que volver a leer y esperar).

        Si `reschedule()` ya programó la hora para esta misma configuración, se respeta esa hora (la que
        devolvió el PUT) en lugar de calcular otra. `generation` es la de antes de leer `settings`: si hubo
        una reprogramación desde entonces, la lectura puede ser anterior al cambio y se descarta."""
        with self._schedule_lock:
            if self._generation != generation:
                return False
            if self._scheduled_for != settings or self._due is None:
                self._program(settings)
            due = self._due if self._due is not None else time.monotonic()
        while (remaining := due - time.monotonic()) > 0:
            if await self._sleep(min(SETTINGS_POLL_SECONDS, remaining)):
                return False  # reprogramado en caliente
            if due - time.monotonic() <= 0:
                break
            try:
                current = await asyncio.to_thread(self._read_settings)
            except Exception:
                logger.exception("El simulador no pudo leer su configuración")
                continue
            if current != settings:
                with self._schedule_lock:
                    if self._generation == generation:
                        self._clear_schedule()
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
