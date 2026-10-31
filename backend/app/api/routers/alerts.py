"""Alertas: GET /alerts, GET /alerts/{id}, POST /alerts (reporte manual) y POST /alerts/{id}/actions."""

from typing import Annotated

from fastapi import APIRouter, Body, Query, Response, status

from app.api.deps import ActorDep, PublisherDep, SessionDep
from app.api.schemas.alerts import (
    AlertActionIn,
    AlertDetailOut,
    AlertPageOut,
    ConfirmActionIn,
    ConfirmOut,
    ManualAlertIn,
)
from app.services.alert_service import AlertListQuery, AlertService

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _csv(raw: str | None) -> list[str]:
    return [part.strip() for part in raw.split(",") if part.strip()] if raw else []


@router.get("", response_model=AlertPageOut, response_model_by_alias=True)
def list_alerts(
    session: SessionDep,
    status_: Annotated[str | None, Query(alias="status")] = None,
    severity: str | None = None,
    zone: str | None = None,
    type_: Annotated[str | None, Query(alias="type")] = None,
    source: str | None = None,
    q: str | None = None,
    date_from: Annotated[str | None, Query(alias="from")] = None,
    date_to: Annotated[str | None, Query(alias="to")] = None,
    sort: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
) -> AlertPageOut:
    query = AlertListQuery(
        status=_csv(status_),
        severity=_csv(severity),
        zone=_csv(zone),
        type=_csv(type_),
        source=_csv(source),
        q=q,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return AlertPageOut.from_page(AlertService(session).list(query))


@router.post(
    "",
    response_model=AlertDetailOut,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def report_manual_alert(
    body: ManualAlertIn, session: SessionDep, actor: ActorDep, publisher: PublisherDep
) -> AlertDetailOut:
    detail = AlertService(session, publisher).report_manual(body.to_command(), actor)
    return AlertDetailOut.from_detail(detail)


@router.get("/{alert_id}", response_model=AlertDetailOut, response_model_by_alias=True)
def get_alert(alert_id: str, session: SessionDep) -> AlertDetailOut:
    return AlertDetailOut.from_detail(AlertService(session).get_detail(alert_id))


@router.post(
    "/{alert_id}/actions",
    response_model=ConfirmOut | AlertDetailOut,
    response_model_by_alias=True,
    responses={201: {"model": ConfirmOut, "description": "Alerta confirmada e incidente creado"}},
)
def apply_alert_action(
    alert_id: str,
    body: Annotated[AlertActionIn, Body()],
    session: SessionDep,
    actor: ActorDep,
    publisher: PublisherDep,
    response: Response,
) -> ConfirmOut | AlertDetailOut:
    result = AlertService(session, publisher).apply_action(alert_id, body.to_command(), actor)
    if isinstance(body, ConfirmActionIn):
        response.status_code = status.HTTP_201_CREATED
        return ConfirmOut.from_result(result)
    return AlertDetailOut.from_detail(result.alert)
