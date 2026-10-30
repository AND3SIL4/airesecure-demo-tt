"""Engine SQLite, sesiones e inicialización de la base de datos (con recuperación ante corrupción)."""

import logging
from collections.abc import Iterator
from sqlite3 import Connection as SQLite3Connection
from typing import Any

from sqlalchemy import event, text
from sqlalchemy.exc import DatabaseError
from sqlmodel import Session, SQLModel, create_engine

from app.config import DATA_DIR, DB_PATH
from app.domain import models  # noqa: F401  (registra las tablas en SQLModel.metadata)
from app.domain.catalogs import utcnow

logger = logging.getLogger(__name__)

engine = create_engine(
    f"sqlite:///{DB_PATH.as_posix()}",
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection: Any, _connection_record: Any) -> None:
    if isinstance(dbapi_connection, SQLite3Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def _database_is_healthy() -> bool:
    if not DB_PATH.exists():
        return True
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA quick_check")).scalar()
        return result == "ok"
    except DatabaseError:
        logger.exception("No se pudo abrir la base de datos %s", DB_PATH)
        return False


def _quarantine_database() -> None:
    engine.dispose()
    stamp = utcnow().strftime("%Y%m%dT%H%M%SZ")
    target = DB_PATH.with_name(f"{DB_PATH.name}.corrupt-{stamp}")
    DB_PATH.rename(target)
    logger.warning("Base de datos corrupta: se movió a %s y se recreará.", target)


def init_db() -> None:
    """Verifica la integridad (renombra la base si está corrupta) y crea las tablas que falten."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not _database_is_healthy():
        _quarantine_database()
    SQLModel.metadata.create_all(engine)
