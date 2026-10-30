"""Inicio de transacciones de escritura serializadas (SQLite `BEGIN IMMEDIATE`, research R4)."""

from sqlmodel import Session

from app.infrastructure.db import begin_write as _begin_write


def begin_write(session: Session) -> None:
    """Abre una transacción de escritura: las lecturas posteriores ven el estado más reciente."""
    _begin_write(session)
