"""Reinicio de la demo (spec 008 R4, doc 10 §1). Implementa `services.ports.DemoResetPort`.

Vive en infrastructure porque recrea el esquema (`drop_all` + `create_all`) y orquesta el simulador. El
trabajo de base de datos corre en un hilo (`asyncio.to_thread`) para no bloquear el event loop, y se
serializa con un lock: dos reinicios simultáneos se ejecutan uno tras otro, nunca a la vez.
"""

import asyncio
import logging
import threading

from sqlalchemy import Engine
from sqlmodel import Session, SQLModel

from app.domain.catalogs import utcnow
from app.infrastructure.db import WRITE_TRANSACTION_OPTION
from app.infrastructure.seed import seed_all
from app.infrastructure.simulator import Simulator
from app.services.demo_service import DemoResetRecorder
from app.services.ports import ResetResult

logger = logging.getLogger(__name__)


class DemoResetter:
    def __init__(self, engine: Engine, simulator: Simulator) -> None:
        self._engine = engine
        self._simulator = simulator
        self._lock = threading.Lock()  # protege la recreación del esquema (hilo de trabajo)
        self._flow_lock = asyncio.Lock()  # serializa el flujo completo, incluidas la pausa y la reanudación

    async def reset(self, actor_id: str) -> ResetResult:
        async with self._flow_lock:
            # 1. Pausa: cancela la espera y aguarda a que termine un tick en curso.
            await self._simulator.pause()
            try:
                # 2-5. Leer la configuración previa del simulador, recrear, sembrar, restaurarla y registrar
                # `demo_reset`, todo en una única transacción.
                result = await asyncio.to_thread(self._recreate, actor_id)
            finally:
                # 6. Reanuda el bucle (si el simulador está apagado, solo espera a que se encienda).
                self._simulator.resume()
            logger.info(
                "Demo reiniciada por %s: %d alertas, %d incidentes", actor_id, result.alerts, result.incidents
            )
            return result

    def _recreate(self, actor_id: str) -> ResetResult:
        with self._lock:
            reset_at = utcnow()
            # SQLite admite DDL transaccional: leer la configuración previa, borrar, crear, sembrar, restaurar
            # y registrar en una sola transacción de escritura (`BEGIN IMMEDIATE`, un único commit) evita que
            # otras peticiones vean la base sin tablas o a medio sembrar, y que la configuración leída cambie
            # antes de restaurarla.
            with self._engine.connect().execution_options(**{WRITE_TRANSACTION_OPTION: True}) as conn:
                with conn.begin():
                    # Las sesiones se unen a la transacción externa con savepoints: sus commits solo liberan
                    # el savepoint; el commit real lo hace `conn.begin()` al salir.
                    with Session(bind=conn, join_transaction_mode="create_savepoint") as session:
                        prior = DemoResetRecorder(session).snapshot_simulator()
                    SQLModel.metadata.drop_all(conn)
                    SQLModel.metadata.create_all(conn)
                    with Session(bind=conn, join_transaction_mode="create_savepoint") as session:
                        seed_all(session)
                    with Session(bind=conn, join_transaction_mode="create_savepoint") as session:
                        return DemoResetRecorder(session).restore_and_record(prior, actor_id, reset_at)
