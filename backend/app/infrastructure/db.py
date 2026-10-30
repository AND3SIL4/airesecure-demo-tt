"""Engine SQLite, sesiones e inicialización de la base de datos (con recuperación ante corrupción)."""

import logging
from collections.abc import Iterator
from sqlite3 import Connection as SQLite3Connection
from typing import Any

from sqlalchemy import Connection, event, text
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


# Opción de ejecución que marca una transacción de escritura: se abre con `BEGIN IMMEDIATE` (research R4).
WRITE_TRANSACTION_OPTION = "aerosecure_write"


@event.listens_for(engine, "connect")
def _on_connect(dbapi_connection: Any, _connection_record: Any) -> None:
    if isinstance(dbapi_connection, SQLite3Connection):
        # El driver no emite BEGIN por su cuenta: lo hace `_on_begin`, para poder elegir el modo.
        dbapi_connection.isolation_level = None
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


@event.listens_for(engine, "begin")
def _on_begin(conn: Connection) -> None:
    """Lecturas con `BEGIN` (diferido); escrituras con `BEGIN IMMEDIATE`, que toma el bloqueo de escritura
    al empezar, de modo que dos escrituras concurrentes se serializan y la segunda ve el estado final."""
    immediate = bool(conn.get_execution_options().get(WRITE_TRANSACTION_OPTION))
    conn.exec_driver_sql("BEGIN IMMEDIATE" if immediate else "BEGIN")


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def begin_write(session: Session) -> None:
    """Abre en `session` una transacción de escritura serializada (`BEGIN IMMEDIATE`).

    Si la sesión tiene una transacción de solo lectura en curso (p. ej., la resolución del actor), la cierra
    antes; no debe haber cambios pendientes.
    """
    if session.in_transaction():
        if session.new or session.dirty or session.deleted:
            raise RuntimeError("begin_write() con cambios pendientes en la sesión")
        session.commit()
    session.connection(execution_options={WRITE_TRANSACTION_OPTION: True})


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
