"""Punto de entrada de la API de AeroSecure AI (demo)."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.errors import register_error_handlers
from app.api.routers import alerts, catalog, health
from app.config import APP_VERSION, CORS_ORIGINS
from app.infrastructure.db import engine, init_db
from app.infrastructure.seed import seed_all


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    with Session(engine) as session:
        seed_all(session)
    yield


app = FastAPI(title="AeroSecure AI API", version=APP_VERSION, lifespan=lifespan)

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
