"""Casos de uso del reinicio de la demo (spec 008 R4, doc 10 §1).

`DemoService.reset` delega la recreación del esquema en el puerto `DemoResetPort` (infrastructure) y publica
`demo.reset` cuando todo quedó confirmado. `DemoResetRecorder` agrupa los pasos con `Session` que el adaptador
ejecuta dentro de su única transacción de escritura: leer la configuración previa del simulador y, sobre la
base recién sembrada, restaurarla y registrar `demo_reset` con su actor.
"""

import json
from datetime import datetime

from sqlmodel import Session

from app.domain.catalogs import SETTING_SIMULATOR_ENABLED, SETTING_SIMULATOR_INTERVAL
from app.domain.enums import TimelineAction
from app.domain.models import TimelineEvent, User
from app.repositories.alert_repo import AlertRepository
from app.repositories.incident_repo import IncidentRepository
from app.repositories.settings_repo import SettingsRepository
from app.repositories.timeline_repo import TimelineRepository
from app.services.alert_service import AlertService, SimulatorSettings
from app.services.common import iso as _iso
from app.services.ports import DemoResetPort, EventPublisher, NullPublisher, ResetResult

# Nombre del evento en vivo (doc 08 §3.7).
EVENT_DEMO_RESET = "demo.reset"


class DemoService:
    def __init__(self, resetter: DemoResetPort, publisher: EventPublisher | None = None) -> None:
        self.resetter = resetter
        self.publisher: EventPublisher = publisher if publisher is not None else NullPublisher()

    async def reset(self, actor: User) -> ResetResult:
        """Reinicia la demo (solo supervisor; el rol lo valida la capa api) y publica `demo.reset`."""
        actor_id = actor.id
        result = await self.resetter.reset(actor_id)
        self.publisher.publish(EVENT_DEMO_RESET, {"resetAt": _iso(result.reset_at), "actorId": actor_id})
        return result


class DemoResetRecorder:
    """Pasos del reinicio que se ejecutan con una `Session` unida a la transacción de escritura del adaptador
    (`BEGIN IMMEDIATE` ya abierto; los commits de la sesión solo liberan savepoints)."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.settings = SettingsRepository(session)
        self.timeline = TimelineRepository(session)
        self.alerts = AlertRepository(session)
        self.incidents = IncidentRepository(session)

    def snapshot_simulator(self) -> SimulatorSettings:
        """Configuración vigente del simulador, para conservarla tras el reinicio."""
        return AlertService(self.session).simulator_settings()

    def restore_and_record(self, prior: SimulatorSettings, actor_id: str, reset_at: datetime) -> ResetResult:
        """Sobre la base recién sembrada: reescribe el encendido y el intervalo previos (los umbrales quedan
        en sus valores por defecto) e inserta `demo_reset` con el actor. Corre dentro de la transacción del
        reinicio, así que no abre una propia."""
        self.settings.set(SETTING_SIMULATOR_ENABLED, prior.enabled)
        self.settings.set(SETTING_SIMULATOR_INTERVAL, prior.interval_seconds)
        alerts = self.alerts.count()
        incidents = self.incidents.count()
        self.timeline.add(
            TimelineEvent(
                actor_id=actor_id,
                action=TimelineAction.DEMO_RESET,
                payload_json=json.dumps(
                    {
                        "alerts": alerts,
                        "incidents": incidents,
                        "simulator": {"enabled": prior.enabled, "intervalSeconds": prior.interval_seconds},
                    }
                ),
                created_at=reset_at,
            )
        )
        self.session.commit()
        return ResetResult(alerts=alerts, incidents=incidents, reset_at=reset_at)
