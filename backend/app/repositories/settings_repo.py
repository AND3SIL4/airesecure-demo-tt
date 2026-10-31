"""Acceso a `app_settings` (clave-valor con valores JSON)."""

import json
from typing import Any

from sqlalchemy import text
from sqlmodel import Session, select

from app.domain.catalogs import utcnow
from app.domain.models import AppSetting


class SettingsRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def ping(self) -> None:
        """Ejecuta `SELECT 1`; lanza la excepción del driver si la base no responde."""
        self.session.exec(text("SELECT 1")).one()  # type: ignore[call-overload]

    def get(self, key: str) -> Any | None:
        setting = self.session.get(AppSetting, key)
        return None if setting is None else json.loads(setting.value_json)

    def get_all(self) -> dict[str, Any]:
        settings = self.session.exec(select(AppSetting)).all()
        return {s.key: json.loads(s.value_json) for s in settings}

    def get_int(self, key: str, default: int) -> int:
        value = self.get(key)
        if value is None:
            return default
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def set(self, key: str, value: Any) -> None:
        """Inserta o actualiza `key` con `value` (serializado como JSON). No hace commit."""
        setting = self.session.get(AppSetting, key)
        if setting is None:
            self.session.add(AppSetting(key=key, value_json=json.dumps(value), updated_at=utcnow()))
            return
        setting.value_json = json.dumps(value)
        setting.updated_at = utcnow()
        self.session.add(setting)

    def increment(self, key: str) -> int:
        """Suma 1 al contador entero `key` (lo crea con 1 si no existe). No hace commit."""
        setting = self.session.get(AppSetting, key)
        if setting is None:
            setting = AppSetting(key=key, value_json=json.dumps(1), updated_at=utcnow())
            self.session.add(setting)
            return 1
        try:
            current = int(json.loads(setting.value_json))
        except (TypeError, ValueError):
            current = 0
        setting.value_json = json.dumps(current + 1)
        setting.updated_at = utcnow()
        self.session.add(setting)
        return current + 1
