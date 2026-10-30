"""Tablas SQLModel (doc 07): catálogos y configuración (001); alertas, incidentes y timeline (002)."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import Column, DateTime, Dialect, Index, Text, TypeDecorator
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel

from app.domain.catalogs import utcnow
from app.domain.enums import (
    AlertOrigin,
    AlertStatus,
    IncidentStatus,
    Role,
    Severity,
    SourceKind,
    TimelineAction,
)


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


class Alert(SQLModel, table=True):
    __tablename__ = "alerts"
    __table_args__ = (
        Index("ix_alerts_status_score", "status", "score"),
        Index("ix_alerts_detected_at", "detected_at"),
        Index("ix_alerts_zone_id", "zone_id"),
        Index("ix_alerts_type_code", "type_code"),
    )

    id: str = Field(primary_key=True, max_length=12, description="ALT-2001…")
    type_code: str = Field(foreign_key="alert_types.code", max_length=32)
    zone_id: str = Field(foreign_key="zones.id", max_length=16)
    source_id: str = Field(foreign_key="sources.id", max_length=16)
    severity: Severity = Field(sa_type=enum_text(Severity, 16))
    status: AlertStatus = Field(default=AlertStatus.NUEVA, sa_type=enum_text(AlertStatus, 16))
    origin: AlertOrigin = Field(sa_type=enum_text(AlertOrigin, 16))
    detected_at: datetime = Field(sa_column=Column(UtcDateTime(), nullable=False))
    confidence: float | None = Field(default=None, ge=0, le=1, description="0.00..1.00")
    score: int = Field(ge=0, le=100, description="0..100")
    score_breakdown_json: str = Field(sa_column=Column(Text, nullable=False))
    description: str = Field(sa_column=Column(Text, nullable=False), description="10..500")
    recommendation: str = Field(sa_column=Column(Text, nullable=False))
    evidence_key: str = Field(max_length=64)
    dismiss_reason: str | None = Field(default=None, max_length=32)
    dismiss_comment: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    reported_by: str | None = Field(default=None, foreign_key="users.id", max_length=16)
    reviewed_by: str | None = Field(default=None, foreign_key="users.id", max_length=16)
    first_action_at: datetime | None = Field(default=None, sa_column=Column(UtcDateTime(), nullable=True))
    closed_at: datetime | None = Field(default=None, sa_column=Column(UtcDateTime(), nullable=True))


class Incident(SQLModel, table=True):
    __tablename__ = "incidents"
    __table_args__ = (
        Index("ix_incidents_status", "status"),
        Index("ix_incidents_opened_at", "opened_at"),
    )

    id: str = Field(primary_key=True, max_length=12, description="INC-0401…")
    alert_id: str = Field(foreign_key="alerts.id", max_length=12, unique=True)
    status: IncidentStatus = Field(default=IncidentStatus.ABIERTO, sa_type=enum_text(IncidentStatus, 16))
    team_id: str | None = Field(default=None, foreign_key="teams.id", max_length=16)
    escalated_to_id: str | None = Field(default=None, foreign_key="teams.id", max_length=16)
    opened_by: str = Field(foreign_key="users.id", max_length=16)
    opened_at: datetime = Field(sa_column=Column(UtcDateTime(), nullable=False))
    started_at: datetime | None = Field(default=None, sa_column=Column(UtcDateTime(), nullable=True))
    escalated_at: datetime | None = Field(default=None, sa_column=Column(UtcDateTime(), nullable=True))
    resolved_at: datetime | None = Field(default=None, sa_column=Column(UtcDateTime(), nullable=True))
    resolution_note: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    response_seconds: int | None = None
    resolution_seconds: int | None = None


class TimelineEvent(SQLModel, table=True):
    """Traza de auditoría (solo inserción). `actor_id` nulo = Sistema."""

    __tablename__ = "timeline_events"
    __table_args__ = (
        Index("ix_timeline_alert", "alert_id", "created_at"),
        Index("ix_timeline_incident", "incident_id", "created_at"),
    )

    id: int | None = Field(default=None, primary_key=True)
    alert_id: str | None = Field(default=None, foreign_key="alerts.id", max_length=12)
    incident_id: str | None = Field(default=None, foreign_key="incidents.id", max_length=12)
    actor_id: str | None = Field(default=None, foreign_key="users.id", max_length=16)
    action: TimelineAction = Field(sa_type=enum_text(TimelineAction, 32))
    from_status: str | None = Field(default=None, max_length=16)
    to_status: str | None = Field(default=None, max_length=16)
    comment: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    payload_json: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    created_at: datetime = Field(default_factory=utcnow, sa_column=Column(UtcDateTime(), nullable=False))
