"""Tablas SQLModel de catálogos y configuración (doc 07, data-model.md de 001)."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import Column, DateTime, Dialect, Text, TypeDecorator
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel

from app.domain.catalogs import utcnow
from app.domain.enums import Role, Severity, SourceKind


def enum_text(enum_cls: type[StrEnum], length: int = 32) -> SAEnum:
    """Columna varchar que guarda el **valor** del enum (`camara`), no el nombre del miembro (doc 07)."""
    return SAEnum(
        enum_cls,
        values_callable=lambda members: [m.value for m in members],
        native_enum=False,
        length=length,
        validate_strings=True,
    )


class UtcDateTime(TypeDecorator[datetime]):
    """DateTime que se guarda normalizado a UTC y se lee siempre con tzinfo=UTC (SQLite no guarda zona)."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC)

    def process_result_value(self, value: Any, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, str):
            value = datetime.fromisoformat(value)
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value.astimezone(UTC)


class Zone(SQLModel, table=True):
    __tablename__ = "zones"

    id: str = Field(primary_key=True, max_length=16)
    name: str = Field(max_length=80, min_length=1)
    terminal: str = Field(max_length=8)
    criticality: int = Field(ge=1, le=3, description="1..3")
    restricted: bool = False
    geom_x: float
    geom_z: float
    geom_w: float = Field(gt=0)
    geom_d: float = Field(gt=0)
    geom_h: float = Field(gt=0)


class Source(SQLModel, table=True):
    __tablename__ = "sources"

    id: str = Field(primary_key=True, max_length=16)
    kind: SourceKind = Field(sa_type=enum_text(SourceKind, 16))
    label: str = Field(max_length=80)
    zone_id: str | None = Field(
        default=None,
        foreign_key="zones.id",
        max_length=16,
        description="nulo solo para fuentes lógicas",
    )


class AlertType(SQLModel, table=True):
    __tablename__ = "alert_types"

    code: str = Field(primary_key=True, max_length=32)
    name: str = Field(max_length=80)
    default_severity: Severity | None = Field(default=None, sa_type=enum_text(Severity, 16), nullable=True)
    scenario_weight: int = Field(ge=0)
    confidence_threshold: float | None = Field(default=None, ge=0.50, le=0.99, description="0.50..0.99")
    recommendation: str = Field(sa_column=Column(Text, nullable=False))
    protocol_json: str = Field(sa_column=Column(Text, nullable=False))


class Team(SQLModel, table=True):
    __tablename__ = "teams"

    id: str = Field(primary_key=True, max_length=16)
    name: str = Field(max_length=80)
    specialty: str = Field(max_length=80)
    specialized: bool = False


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(primary_key=True, max_length=16)
    alias: str = Field(max_length=40)
    role: Role = Field(sa_type=enum_text(Role, 16))


class AppSetting(SQLModel, table=True):
    __tablename__ = "app_settings"

    key: str = Field(primary_key=True, max_length=64)
    value_json: str = Field(sa_column=Column(Text, nullable=False))
    updated_at: datetime = Field(
        default_factory=utcnow,
        sa_column=Column(UtcDateTime(), nullable=False),
    )
