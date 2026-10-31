"""Casos de uso de la configuración de la demo (spec 008 R2): consultar y actualizar (parcial) el simulador y
los umbrales. Cada cambio registra `settings_updated` y, tras el commit, publica `settings.updated`."""

import json
from collections.abc import Callable
from dataclasses import dataclass, field, replace
from datetime import datetime
from typing import Any

from sqlmodel import Session

from app.domain import settings_rules
from app.domain.catalogs import (
    DEFAULT_SIMULATOR_ENABLED,
    DEFAULT_SIMULATOR_INTERVAL_SECONDS,
    SETTING_BELOW_THRESHOLD,
    SETTING_SIMULATOR_ENABLED,
    SETTING_SIMULATOR_INTERVAL,
    SETTING_THRESHOLD_PREFIX,
    utcnow,
)
from app.domain.enums import TimelineAction
from app.domain.models import TimelineEvent, User
from app.repositories.catalog_repo import CatalogRepository
from app.repositories.settings_repo import SettingsRepository
from app.repositories.timeline_repo import TimelineRepository
from app.repositories.transaction import begin_write
from app.services.alert_service import SimulatorSettings
from app.services.common import iso as _iso
from app.services.common import validation_error as _validation_error
from app.services.ports import EventPublisher, NullPublisher

# Nombre del evento en vivo (doc 08 §3.7).
EVENT_SETTINGS_UPDATED = "settings.updated"

# Aplica al simulador real una configuración ya confirmada y devuelve su nuevo `next_run_at` (lo aporta la
# capa api; p. ej., `Simulator.reschedule`).
SimulatorRescheduler = Callable[[SimulatorSettings], datetime | None]


# ---------- Entradas ----------


@dataclass(frozen=True)
class SettingsUpdate:
    """Cambios parciales: None = sin cambio."""

    simulator_enabled: bool | None = None
    simulator_interval_seconds: int | None = None
    thresholds: dict[str, float] = field(default_factory=dict)

    @property
    def is_empty(self) -> bool:
        return (
            self.simulator_enabled is None and self.simulator_interval_seconds is None and not self.thresholds
        )


# ---------- Vistas ----------


@dataclass(frozen=True)
class SimulatorStateView:
    enabled: bool
    interval_seconds: int
    running: bool
    next_run_at: datetime | None


@dataclass(frozen=True)
class SettingsView:
    simulator: SimulatorStateView
    thresholds: dict[str, float]
    below_threshold: int


def settings_payload(view: SettingsView) -> dict[str, Any]:
    """`Settings` en camelCase para el evento `settings.updated`.

    Debe mantenerse sincronizado con `api/schemas/settings.py::SettingsOut` (mismo contrato).
    """
    return {
        "simulator": {
            "enabled": view.simulator.enabled,
            "intervalSeconds": view.simulator.interval_seconds,
            "running": view.simulator.running,
            "nextRunAt": _iso(view.simulator.next_run_at),
        },
        "thresholds": dict(view.thresholds),
        "belowThreshold": view.below_threshold,
    }


def _change_payload(changes: SettingsUpdate) -> dict[str, Any]:
    """Los cambios pedidos, con la misma forma que el cuerpo del PUT (payload de la timeline)."""
    payload: dict[str, Any] = {}
    simulator: dict[str, Any] = {}
    if changes.simulator_enabled is not None:
        simulator["enabled"] = changes.simulator_enabled
    if changes.simulator_interval_seconds is not None:
        simulator["intervalSeconds"] = changes.simulator_interval_seconds
    if simulator:
        payload["simulator"] = simulator
    if changes.thresholds:
        payload["thresholds"] = dict(changes.thresholds)
    return payload


class SettingsService:
    def __init__(self, session: Session, publisher: EventPublisher | None = None) -> None:
        self.session = session
        self.publisher: EventPublisher = publisher if publisher is not None else NullPublisher()
        self.settings = SettingsRepository(session)
        self.catalog = CatalogRepository(session)
        self.timeline = TimelineRepository(session)

    def get(self, simulator_running: bool, next_run_at: datetime | None) -> SettingsView:
        """`simulator_running` y `next_run_at` los aporta quien conoce el simulador real (la capa api)."""
        stored = self.settings.get_all()
        raw_enabled = stored.get(SETTING_SIMULATOR_ENABLED)
        enabled = DEFAULT_SIMULATOR_ENABLED if raw_enabled is None else bool(raw_enabled)
        interval = self.settings.get_int(SETTING_SIMULATOR_INTERVAL, DEFAULT_SIMULATOR_INTERVAL_SECONDS)
        thresholds: dict[str, float] = {}
        for alert_type in self.catalog.list_alert_types():
            if alert_type.confidence_threshold is None:
                continue
            override = stored.get(f"{SETTING_THRESHOLD_PREFIX}{alert_type.code}")
            thresholds[alert_type.code] = (
                float(override) if override is not None else alert_type.confidence_threshold
            )
        below_threshold = self.settings.get_int(SETTING_BELOW_THRESHOLD, 0)
        # En ejecución = tarea viva **y** habilitado (igual que /health); sin ejecución no hay próximo evento.
        running = simulator_running and enabled
        return SettingsView(
            simulator=SimulatorStateView(
                enabled=enabled,
                interval_seconds=interval,
                running=running,
                next_run_at=next_run_at if running else None,
            ),
            thresholds=thresholds,
            below_threshold=below_threshold,
        )

    def update(
        self,
        changes: SettingsUpdate,
        actor: User,
        simulator_running: bool,
        next_run_at: datetime | None,
        reschedule: SimulatorRescheduler | None = None,
    ) -> SettingsView:
        """Valida, hace el upsert en `app_settings` e inserta `settings_updated` (sin alerta ni incidente) en
        una sola transacción. Tras el commit, si cambió el encendido o el intervalo, reprograma el
        simulador con `reschedule` (para que la respuesta y el evento lleven el `nextRunAt` nuevo) y publica
        `settings.updated` con el estado completo."""
        actor_id = actor.id
        begin_write(self.session)
        defaults = {t.code: t.confidence_threshold for t in self.catalog.list_alert_types()}
        errors = settings_rules.validate_interval(changes.simulator_interval_seconds)
        errors.extend(settings_rules.validate_thresholds(changes.thresholds, defaults))
        if errors:
            raise _validation_error(errors)
        if changes.is_empty:
            self.session.rollback()
            return self.get(simulator_running, next_run_at)

        normalized = SettingsUpdate(
            simulator_enabled=changes.simulator_enabled,
            simulator_interval_seconds=changes.simulator_interval_seconds,
            thresholds={c: settings_rules.normalize_threshold(v) for c, v in changes.thresholds.items()},
        )
        if normalized.simulator_enabled is not None:
            self.settings.set(SETTING_SIMULATOR_ENABLED, normalized.simulator_enabled)
        if normalized.simulator_interval_seconds is not None:
            self.settings.set(SETTING_SIMULATOR_INTERVAL, normalized.simulator_interval_seconds)
        for code, value in normalized.thresholds.items():
            self.settings.set(f"{SETTING_THRESHOLD_PREFIX}{code}", value)
        self.timeline.add(
            TimelineEvent(
                actor_id=actor_id,
                action=TimelineAction.SETTINGS_UPDATED,
                payload_json=json.dumps(_change_payload(normalized)),
                created_at=utcnow(),
            )
        )
        self.session.commit()
        view = self.get(simulator_running, next_run_at)
        self.session.rollback()  # cierra la transacción de solo lectura de `get`
        simulator_changed = (
            normalized.simulator_enabled is not None or normalized.simulator_interval_seconds is not None
        )
        if reschedule is not None and simulator_changed:
            sim = view.simulator
            new_next_run_at = reschedule(
                SimulatorSettings(enabled=sim.enabled, interval_seconds=sim.interval_seconds)
            )
            view = replace(view, simulator=replace(sim, next_run_at=new_next_run_at if sim.running else None))
        self.publisher.publish(EVENT_SETTINGS_UPDATED, settings_payload(view))
        return view
