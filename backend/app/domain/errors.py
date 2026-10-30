"""Errores de dominio. La capa api los traduce al formato común {error:{code,message,details}} (doc 08 §1)."""

from typing import Any

ACTOR_REQUERIDO = "ACTOR_REQUERIDO"
SOLO_SUPERVISOR = "SOLO_SUPERVISOR"
NO_ENCONTRADO = "NO_ENCONTRADO"
TRANSICION_INVALIDA = "TRANSICION_INVALIDA"
VALIDACION = "VALIDACION"
EQUIPO_REQUERIDO = "EQUIPO_REQUERIDO"
ERROR_INTERNO = "ERROR_INTERNO"


class DomainError(Exception):
    """Violación de una regla de negocio con su código; la capa api decide el estado HTTP."""

    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code: str = code
        self.message: str = message
        self.details: dict[str, Any] = details or {}
