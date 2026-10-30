"""Acceso a `app_settings` (clave-valor con valores JSON)."""

import json
from typing import Any

from sqlalchemy import text
from sqlmodel import Session, select

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
