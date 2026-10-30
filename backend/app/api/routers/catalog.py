"""Catálogos: GET /users, /me, /zones, /sources, /teams, /alert-types y /dismiss-reasons."""

from fastapi import APIRouter

from app.api.deps import ActorDep, SessionDep
from app.api.schemas.catalog import (
    AlertTypeOut,
    DismissReasonOut,
    SourceOut,
    TeamOut,
    UserOut,
    ZoneOut,
)
from app.services.catalog_service import CatalogService

router = APIRouter(tags=["catalog"])


@router.get("/users", response_model=list[UserOut], response_model_by_alias=True)
def list_users(session: SessionDep) -> list[UserOut]:
    return [UserOut.model_validate(u) for u in CatalogService(session).list_users()]


@router.get("/me", response_model=UserOut, response_model_by_alias=True)
def get_me(actor: ActorDep) -> UserOut:
    return UserOut.model_validate(actor)


@router.get("/zones", response_model=list[ZoneOut], response_model_by_alias=True)
def list_zones(session: SessionDep) -> list[ZoneOut]:
    return [ZoneOut.from_view(z) for z in CatalogService(session).list_zones()]


@router.get("/sources", response_model=list[SourceOut], response_model_by_alias=True)
def list_sources(session: SessionDep) -> list[SourceOut]:
    return [SourceOut.model_validate(s) for s in CatalogService(session).list_sources()]


@router.get("/teams", response_model=list[TeamOut], response_model_by_alias=True)
def list_teams(session: SessionDep) -> list[TeamOut]:
    return [TeamOut.model_validate(t) for t in CatalogService(session).list_teams()]


@router.get("/alert-types", response_model=list[AlertTypeOut], response_model_by_alias=True)
def list_alert_types(session: SessionDep) -> list[AlertTypeOut]:
    return [AlertTypeOut.from_view(t) for t in CatalogService(session).list_alert_types()]


@router.get(
    "/dismiss-reasons",
    response_model=list[DismissReasonOut],
    response_model_by_alias=True,
    response_model_exclude_none=True,
)
def list_dismiss_reasons(session: SessionDep) -> list[DismissReasonOut]:
    return [DismissReasonOut.from_view(r) for r in CatalogService(session).list_dismiss_reasons()]
