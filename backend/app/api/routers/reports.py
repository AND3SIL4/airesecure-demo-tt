"""Reportes: GET /reports/incidents.csv (solo supervisor; mismos filtros que /incidents, sin paginar)."""

from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.api.deps import SessionDep, SupervisorDep
from app.api.params import split_list
from app.domain.catalogs import utcnow
from app.services.incident_service import IncidentListQuery
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])

UTF8_BOM = "﻿"  # para que Excel abra el archivo con las tildes correctas


@router.get("/incidents.csv", response_class=Response)
def incidents_csv(
    session: SessionDep,
    _supervisor: SupervisorDep,
    status_: Annotated[str | None, Query(alias="status")] = None,
    severity: str | None = None,
    zone: str | None = None,
    type_: Annotated[str | None, Query(alias="type")] = None,
    q: str | None = None,
    date_from: Annotated[str | None, Query(alias="from")] = None,
    date_to: Annotated[str | None, Query(alias="to")] = None,
    sort: str | None = None,
) -> Response:
    query = IncidentListQuery(
        status=split_list(status_),
        severity=split_list(severity),
        zone=split_list(zone),
        type=split_list(type_),
        q=q,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
    )
    filename, content = ReportService(session).incidents_csv(query, utcnow())
    return Response(
        content=UTF8_BOM + content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
