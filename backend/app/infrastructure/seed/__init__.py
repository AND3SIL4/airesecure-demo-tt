"""Siembra idempotente: catálogos, configuración inicial y alertas de hoy (solo si no hay alertas)."""

import json
from typing import Any

from sqlmodel import Session

from app.domain.catalogs import (
    DEFAULT_SIMULATOR_ENABLED,
    DEFAULT_SIMULATOR_INTERVAL_SECONDS,
    utcnow,
)
from app.domain.enums import SourceKind
from app.domain.models import AlertType, AppSetting, Source, Team, User, Zone
from app.infrastructure.seed.alerts import seed_alerts
from app.infrastructure.seed.catalogs import (
    ALERT_TYPES,
    CAMERAS,
    LOGICAL_SOURCES,
    SENSORS,
    TEAMS,
    TERMINAL,
    USERS,
    ZONES,
)


def _seed_zones(session: Session) -> None:
    for z in ZONES:
        session.merge(
            Zone(
                id=z["id"],
                name=z["name"],
                terminal=TERMINAL,
                criticality=z["criticality"],
                restricted=z["restricted"],
                geom_x=z["x"],
                geom_z=z["z"],
                geom_w=z["w"],
                geom_d=z["d"],
                geom_h=z["h"],
            )
        )


def _seed_sources(session: Session) -> None:
    for cam_id, zone_id in CAMERAS:
        session.merge(Source(id=cam_id, kind=SourceKind.CAMARA, label=f"Cámara {cam_id}", zone_id=zone_id))
    for sen_id, zone_id in SENSORS:
        session.merge(
            Source(id=sen_id, kind=SourceKind.SENSOR, label=f"Sensor de acceso {sen_id}", zone_id=zone_id)
        )
    for src_id, kind, label in LOGICAL_SOURCES:
        session.merge(Source(id=src_id, kind=kind, label=label, zone_id=None))


def _seed_alert_types(session: Session) -> None:
    for t in ALERT_TYPES:
        session.merge(
            AlertType(
                code=t["code"],
                name=t["name"],
                default_severity=t["default_severity"],
                scenario_weight=t["scenario_weight"],
                confidence_threshold=t["confidence_threshold"],
                recommendation=t["recommendation"],
                protocol_json=json.dumps(t["protocol"], ensure_ascii=False),
            )
        )


def _seed_settings(session: Session) -> None:
    defaults: dict[str, Any] = {
        "simulator.enabled": DEFAULT_SIMULATOR_ENABLED,
        "simulator.interval_seconds": DEFAULT_SIMULATOR_INTERVAL_SECONDS,
    }
    for t in ALERT_TYPES:
        if t["confidence_threshold"] is not None:
            defaults[f"thresholds.{t['code']}"] = t["confidence_threshold"]
    now = utcnow()
    for key, value in defaults.items():
        if session.get(AppSetting, key) is None:  # no sobrescribe los valores existentes
            session.add(AppSetting(key=key, value_json=json.dumps(value), updated_at=now))


def seed_catalogs(session: Session) -> None:
    """Upsert por clave primaria de los catálogos; app_settings solo se inserta si la clave no existe."""
    _seed_zones(session)
    session.flush()  # las zonas deben existir antes de las fuentes (FK)
    _seed_sources(session)
    _seed_alert_types(session)
    for team in TEAMS:
        session.merge(Team(**team))
    for user in USERS:
        session.merge(User(**user))
    _seed_settings(session)
    session.commit()


def seed_all(session: Session) -> None:
    """Catálogos (upsert) y, si la tabla está vacía, las alertas relativas a "ahora"."""
    seed_catalogs(session)
    seed_alerts(session, utcnow())
