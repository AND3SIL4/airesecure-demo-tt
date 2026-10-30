"""DTOs de alertas (specs/002-alertas/contracts/api-alerts.md, doc 08 §2)."""

from datetime import datetime
from typing import Annotated, Any, Literal

from pydantic import Field

from app.api.schemas.base import ApiModel
from app.domain.enums import (
    AlertAction,
    AlertOrigin,
    AlertStatus,
    DismissReason,
    IncidentStatus,
    Severity,
    SourceKind,
)
from app.domain.models import Incident, User
from app.services.alert_service import (
    AlertActionResult,
    AlertCommand,
    AlertDetailView,
    AlertPage,
    AlertView,
    ManualAlertCommand,
    TimelineEntryView,
)

# ---------- Salida ----------


class AlertTypeRefOut(ApiModel):
    code: str
    name: str


class ZoneRefOut(ApiModel):
    id: str
    name: str


class SourceRefOut(ApiModel):
    id: str
    kind: SourceKind
    label: str


class UserRefOut(ApiModel):
    id: str
    alias: str

    @classmethod
    def from_user(cls, user: User | None) -> "UserRefOut | None":
        return None if user is None else cls(id=user.id, alias=user.alias)


class AlertSummaryOut(ApiModel):
    id: str
    type: AlertTypeRefOut
    severity: Severity
    status: AlertStatus
    zone: ZoneRefOut
    source: SourceRefOut
    detected_at: datetime
    confidence: float | None
    score: int
    description: str
    incident_id: str | None

    @classmethod
    def summary_fields(cls, view: AlertView) -> dict[str, Any]:
        alert = view.alert
        return {
            "id": alert.id,
            "type": AlertTypeRefOut(code=view.type.code, name=view.type.name),
            "severity": alert.severity,
            "status": alert.status,
            "zone": ZoneRefOut(id=view.zone.id, name=view.zone.name),
            "source": SourceRefOut(id=view.source.id, kind=view.source.kind, label=view.source.label),
            "detected_at": alert.detected_at,
            "confidence": alert.confidence,
            "score": alert.score,
            "description": alert.description,
            "incident_id": view.incident_id,
        }

    @classmethod
    def from_view(cls, view: AlertView) -> "AlertSummaryOut":
        return cls(**cls.summary_fields(view))


class AlertPageOut(ApiModel):
    """`PageOut[AlertSummary]`: `{items, total, page, pageSize}`."""

    items: list[AlertSummaryOut]
    total: int
    page: int
    page_size: int

    @classmethod
    def from_page(cls, page: AlertPage) -> "AlertPageOut":
        return cls(
            items=[AlertSummaryOut.from_view(v) for v in page.items],
            total=page.total,
            page=page.page,
            page_size=page.page_size,
        )


class ScoreBreakdownOut(ApiModel):
    severity_weight: float
    confidence: float
    zone_factor: float
    zone_criticality: int
    score: int
    manual: bool


class TimelineEventOut(ApiModel):
    id: int
    action: str
    actor: UserRefOut | None
    from_status: str | None
    to_status: str | None
    comment: str | None
    payload: dict[str, Any] | None
    created_at: datetime

    @classmethod
    def from_entry(cls, entry: TimelineEntryView) -> "TimelineEventOut":
        event = entry.event
        return cls(
            id=event.id or 0,
            action=event.action.value,
            actor=UserRefOut.from_user(entry.actor),
            from_status=event.from_status,
            to_status=event.to_status,
            comment=event.comment,
            payload=entry.payload,
            created_at=event.created_at,
        )


class AlertDetailOut(AlertSummaryOut):
    score_breakdown: ScoreBreakdownOut
    recommendation: str
    protocol: list[str]
    evidence_url: str
    evidence_is_illustrative: Literal[True] = True
    origin: AlertOrigin
    dismiss_reason: DismissReason | None
    dismiss_reason_label: str | None
    dismiss_comment: str | None
    reviewed_by: UserRefOut | None
    reported_by: UserRefOut | None
    first_action_at: datetime | None
    closed_at: datetime | None
    timeline: list[TimelineEventOut]

    @classmethod
    def from_detail(cls, view: AlertDetailView) -> "AlertDetailOut":
        alert = view.summary.alert
        breakdown = view.score_breakdown
        return cls(
            **cls.summary_fields(view.summary),
            score_breakdown=ScoreBreakdownOut(
                severity_weight=breakdown.severity_weight,
                confidence=breakdown.confidence,
                zone_factor=breakdown.zone_factor,
                zone_criticality=breakdown.zone_criticality,
                score=breakdown.score,
                manual=breakdown.manual,
            ),
            recommendation=alert.recommendation,
            protocol=view.protocol,
            evidence_url=f"/evidence/{alert.evidence_key}.svg",
            origin=alert.origin,
            dismiss_reason=DismissReason(alert.dismiss_reason) if alert.dismiss_reason else None,
            dismiss_reason_label=view.dismiss_reason_label,
            dismiss_comment=alert.dismiss_comment,
            reviewed_by=UserRefOut.from_user(view.reviewed_by),
            reported_by=UserRefOut.from_user(view.reported_by),
            first_action_at=alert.first_action_at,
            closed_at=alert.closed_at,
            timeline=[TimelineEventOut.from_entry(e) for e in view.timeline],
        )


class IncidentRefOut(ApiModel):
    id: str
    status: IncidentStatus
    alert_id: str
    opened_at: datetime

    @classmethod
    def from_incident(cls, incident: Incident) -> "IncidentRefOut":
        return cls(
            id=incident.id,
            status=incident.status,
            alert_id=incident.alert_id,
            opened_at=incident.opened_at,
        )


class ConfirmOut(ApiModel):
    alert: AlertDetailOut
    incident: IncidentRefOut

    @classmethod
    def from_result(cls, result: AlertActionResult) -> "ConfirmOut":
        assert result.incident is not None
        return cls(
            alert=AlertDetailOut.from_detail(result.alert),
            incident=IncidentRefOut.from_incident(result.incident),
        )


# ---------- Entrada ----------


class ReviewActionIn(ApiModel):
    action: Literal["review"]

    def to_command(self) -> AlertCommand:
        return AlertCommand(action=AlertAction.REVIEW)


class ConfirmActionIn(ApiModel):
    action: Literal["confirm"]
    note: str | None = Field(default=None, max_length=500)

    def to_command(self) -> AlertCommand:
        return AlertCommand(action=AlertAction.CONFIRM, note=self.note)


class DismissActionIn(ApiModel):
    action: Literal["dismiss"]
    reason: DismissReason
    comment: str | None = Field(default=None, max_length=500)

    def to_command(self) -> AlertCommand:
        return AlertCommand(action=AlertAction.DISMISS, reason=self.reason.value, comment=self.comment)


class CommentActionIn(ApiModel):
    action: Literal["comment"]
    comment: str = Field(min_length=3, max_length=500)

    def to_command(self) -> AlertCommand:
        return AlertCommand(action=AlertAction.COMMENT, comment=self.comment)


AlertActionIn = Annotated[
    ReviewActionIn | ConfirmActionIn | DismissActionIn | CommentActionIn,
    Field(discriminator="action"),
]


class ManualAlertIn(ApiModel):
    type_code: str = Field(min_length=1, max_length=32)
    zone_id: str = Field(min_length=1, max_length=16)
    severity: Severity
    description: str = Field(min_length=10, max_length=500)

    def to_command(self) -> ManualAlertCommand:
        return ManualAlertCommand(
            type_code=self.type_code,
            zone_id=self.zone_id,
            severity=self.severity,
            description=self.description,
        )
