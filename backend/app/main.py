"""Punto de entrada de la API de AeroSecure AI (demo). Un solo proceso uvicorn (bus de eventos en memoria)."""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.errors import register_error_handlers
from app.api.routers import alerts, catalog, demo, health, incidents, stream
from app.config import APP_VERSION, CORS_ORIGINS
from app.infrastructure.db import engine, init_db
from app.infrastructure.event_bus import EventBus, close_on_exit_signals
from app.infrastructure.seed import seed_all
from app.infrastructure.simulator import Simulator


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    init_db()
    with Session(engine) as session:
        seed_all(session)
    bus: EventBus = app.state.event_bus
    simulator: Simulator = app.state.simulator
    bus.bind_loop(asyncio.get_running_loop())
    close_on_exit_signals(bus)  # Ctrl+C cierra los streams SSE abiertos para no bloquear el apagado
    simulator.start()
    try:
        yield
    finally:
        await simulator.stop()
        bus.close()


app = FastAPI(title="AeroSecure AI API", version=APP_VERSION, lifespan=lifespan)
app.state.event_bus = EventBus()
app.state.simulator = Simulator(engine, app.state.event_bus)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

API_PREFIX = "/api"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(catalog.router, prefix=API_PREFIX)
app.include_router(alerts.router, prefix=API_PREFIX)
app.include_router(incidents.router, prefix=API_PREFIX)
app.include_router(stream.router, prefix=API_PREFIX)
app.include_router(demo.router, prefix=API_PREFIX)
