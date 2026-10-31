"""Incidentes: GET /incidents, GET /incidents/{id} y POST /incidents/{id}/actions."""

from typing import Annotated

from fastapi import APIRouter, Body, Query

from app.api.deps import ActorDep, PublisherDep, SessionDep
from app.api.schemas.incidents import IncidentActionIn, IncidentDetailOut, IncidentPageOut
from app.services.incident_service import IncidentListQuery, IncidentService

router = APIRouter(prefix="/incidents", tags=["incidents"])


def _csv(raw: str | None) -> list[str]:
    return [part.strip() for part in raw.split(",") if part.strip()] if raw else []


@router.get("", response_model=IncidentPageOut, response_model_by_alias=True)
def list_incidents(
    session: SessionDep,
    status_: Annotated[str | None, Query(alias="status")] = None,
    severity: str | None = None,
    zone: str | None = None,
    type_: Annotated[str | None, Query(alias="type")] = None,
    q: str | None = None,
    date_from: Annotated[str | None, Query(alias="from")] = None,
    date_to: Annotated[str | None, Query(alias="to")] = None,
    sort: str | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(alias="pageSize", ge=1, le=100)] = 20,
) -> IncidentPageOut:
    query = IncidentListQuery(
        status=_csv(status_),
        severity=_csv(severity),
        zone=_csv(zone),
        type=_csv(type_),
        q=q,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return IncidentPageOut.from_page(IncidentService(session).list(query))


@router.get("/{incident_id}", response_model=IncidentDetailOut, response_model_by_alias=True)
def get_incident(incident_id: str, session: SessionDep) -> IncidentDetailOut:
    return IncidentDetailOut.from_detail(IncidentService(session).get_detail(incident_id))


@router.post("/{incident_id}/actions", response_model=IncidentDetailOut, response_model_by_alias=True)
def apply_incident_action(
    incident_id: str,
    body: Annotated[IncidentActionIn, Body()],
    session: SessionDep,
    actor: ActorDep,
    publisher: PublisherDep,
) -> IncidentDetailOut:
    detail = IncidentService(session, publisher).apply_action(incident_id, body.to_command(), actor)
    return IncidentDetailOut.from_detail(detail)
