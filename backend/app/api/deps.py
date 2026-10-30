"""Dependencias comunes de los routers: sesión, actor (X-Actor-Id) y rol de supervisor."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Header
from sqlmodel import Session

from app.domain.errors import SOLO_SUPERVISOR, DomainError
from app.domain.models import User
from app.infrastructure.db import get_session as _db_session
from app.services.catalog_service import CatalogService


def get_session() -> Iterator[Session]:
    yield from _db_session()


SessionDep = Annotated[Session, Depends(get_session)]


def get_actor(
    session: SessionDep,
    x_actor_id: Annotated[str | None, Header(alias="X-Actor-Id")] = None,
) -> User:
    return CatalogService(session).resolve_actor(x_actor_id)


ActorDep = Annotated[User, Depends(get_actor)]


def require_supervisor(actor: ActorDep) -> User:
    if not CatalogService.is_supervisor(actor):
        raise DomainError(SOLO_SUPERVISOR, "Esta acción es solo para supervisores.")
    return actor


SupervisorDep = Annotated[User, Depends(require_supervisor)]
