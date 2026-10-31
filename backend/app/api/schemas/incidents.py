"""DTOs de incidentes (specs/004-incidentes/contracts/api-incidents.md, doc 08 §2)."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field

from app.api.schemas.alerts import AlertSummaryOut, TimelineEventOut, UserRefOut
from app.api.schemas.base import ApiModel
from app.domain.enums import IncidentAction, IncidentStatus
from app.domain.models import Team
from app.services.incident_service import (
    IncidentCommand,
    IncidentDetailView,
    IncidentPage,
    IncidentView,
)

# ---------- Salida ----------


class TeamRefOut(ApiModel):
    id: str
    name: str

    @classmethod
    def from_team(cls, team: Team | None) -> "TeamRefOut | None":
        return None if team is None else cls(id=team.id, name=team.name)


class IncidentOut(ApiModel):
    """`Incident` del doc 08 §2 (sin `timeline`)."""

    id: str
    status: IncidentStatus
    alert: AlertSummaryOut
    team: TeamRefOut | None
    escalated_to: TeamRefOut | None
    opened_by: UserRefOut | None
    opened_at: datetime
    started_at: datetime | None
    escalated_at: datetime | None
    resolved_at: datetime | None
    resolution_note: str | None
    response_seconds: int | None
    resolution_seconds: int | None

    @classmethod
    def from_view(cls, view: IncidentView) -> "IncidentOut":
        return cls(**cls._fields(view))

    @staticmethod
    def _fields(view: IncidentView) -> dict[str, object]:
        incident = view.incident
        return {
            "id": incident.id,
            "status": incident.status,
            "alert": AlertSummaryOut.from_view(view.alert),
            "team": TeamRefOut.from_team(view.team),
            "escalated_to": TeamRefOut.from_team(view.escalated_to),
            "opened_by": UserRefOut.from_user(view.opened_by),
            "opened_at": incident.opened_at,
            "started_at": incident.started_at,
            "escalated_at": incident.escalated_at,
            "resolved_at": incident.resolved_at,
            "resolution_note": incident.resolution_note,
            "response_seconds": incident.response_seconds,
            "resolution_seconds": incident.resolution_seconds,
        }


class IncidentDetailOut(IncidentOut):
    """`Incident` con la historia combinada (alerta de origen + incidente) en orden ascendente."""

    timeline: list[TimelineEventOut]

    @classmethod
    def from_detail(cls, view: IncidentDetailView) -> "IncidentDetailOut":
        return cls(
            **IncidentOut._fields(view.summary),
            timeline=[TimelineEventOut.from_entry(e) for e in view.timeline],
        )


class IncidentPageOut(ApiModel):
    """`PageOut[Incident]`: `{items, total, page, pageSize}`."""

    items: list[IncidentOut]
    total: int
    page: int
    page_size: int

    @classmethod
    def from_page(cls, page: IncidentPage) -> "IncidentPageOut":
        return cls(
            items=[IncidentOut.from_view(v) for v in page.items],
            total=page.total,
            page=page.page,
            page_size=page.page_size,
        )


# ---------- Entrada ----------
# Las longitudes mínimas (motivo, nota y comentario) las valida el dominio con sus mensajes (data-model.md).


class AssignActionIn(ApiModel):
    action: Literal["assign"]
    team_id: str = Field(min_length=1, max_length=16)
    comment: str | None = Field(default=None, max_length=500)

    def to_command(self) -> IncidentCommand:
        return IncidentCommand(action=IncidentAction.ASSIGN, team_id=self.team_id, comment=self.comment)


class StartActionIn(ApiModel):
    action: Literal["start"]

    def to_command(self) -> IncidentCommand:
        return IncidentCommand(action=IncidentAction.START)


class EscalateActionIn(ApiModel):
    action: Literal["escalate"]
    team_id: str = Field(min_length=1, max_length=16)
    reason: str = Field(max_length=500)

    def to_command(self) -> IncidentCommand:
        return IncidentCommand(action=IncidentAction.ESCALATE, team_id=self.team_id, reason=self.reason)


class ResolveActionIn(ApiModel):
    action: Literal["resolve"]
    note: str = Field(max_length=500)

    def to_command(self) -> IncidentCommand:
        return IncidentCommand(action=IncidentAction.RESOLVE, note=self.note)


class CommentIncidentActionIn(ApiModel):
    action: Literal["comment"]
    comment: str = Field(max_length=500)

    def to_command(self) -> IncidentCommand:
        return IncidentCommand(action=IncidentAction.COMMENT, comment=self.comment)


IncidentActionIn = Annotated[
    AssignActionIn | StartActionIn | EscalateActionIn | ResolveActionIn | CommentIncidentActionIn,
    Field(discriminator="action"),
]
