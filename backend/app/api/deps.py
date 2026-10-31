"""Dependencias comunes de los routers: sesión, actor (X-Actor-Id), rol de supervisor, bus y simulador."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Header, Request
from sqlmodel import Session

from app.domain.errors import SOLO_SUPERVISOR, DomainError
from app.domain.models import User
from app.infrastructure.db import get_session as _db_session
from app.infrastructure.event_bus import EventBus
from app.infrastructure.simulator import Simulator
from app.services.catalog_service import CatalogService
from app.services.ports import EventPublisher


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


def get_event_bus(request: Request) -> EventBus:
    bus: EventBus = request.app.state.event_bus
    return bus


EventBusDep = Annotated[EventBus, Depends(get_event_bus)]


def get_publisher(request: Request) -> EventPublisher:
    """El bus en memoria visto como puerto de publicación de los servicios."""
    return get_event_bus(request)


PublisherDep = Annotated[EventPublisher, Depends(get_publisher)]


def get_simulator(request: Request) -> Simulator:
    simulator: Simulator = request.app.state.simulator
    return simulator


SimulatorDep = Annotated[Simulator, Depends(get_simulator)]
