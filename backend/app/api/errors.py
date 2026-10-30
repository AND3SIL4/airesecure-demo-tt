"""Traducción de excepciones al formato común `{error:{code,message,details}}` (doc 08 §1)."""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.schemas.base import ErrorBody, ErrorDetail
from app.domain.errors import (
    ACTOR_REQUERIDO,
    EQUIPO_REQUERIDO,
    ERROR_INTERNO,
    NO_ENCONTRADO,
    SOLO_SUPERVISOR,
    TRANSICION_INVALIDA,
    VALIDACION,
    DomainError,
)

logger = logging.getLogger(__name__)

# Código de dominio -> estado HTTP (doc 08 §1). Los códigos no listados responden 400.
_DOMAIN_STATUS: dict[str, int] = {
    ACTOR_REQUERIDO: 401,
    SOLO_SUPERVISOR: 403,
    NO_ENCONTRADO: 404,
    TRANSICION_INVALIDA: 409,
    VALIDACION: 422,
    EQUIPO_REQUERIDO: 422,
}
_DEFAULT_DOMAIN_STATUS = 400

_HTTP_CODES: dict[int, tuple[str, str]] = {
    404: (NO_ENCONTRADO, "El recurso solicitado no existe."),
    405: ("METODO_NO_PERMITIDO", "El método HTTP no está permitido en esta ruta."),
}


def error_response(
    status: int, code: str, message: str, details: dict[str, Any] | None = None
) -> JSONResponse:
    body = ErrorBody(error=ErrorDetail(code=code, message=message, details=details or {}))
    return JSONResponse(status_code=status, content=body.model_dump(by_alias=True))


def _field_name(loc: tuple[int | str, ...]) -> str:
    parts = [str(p) for p in loc]
    if len(parts) > 1 and parts[0] in {"body", "query", "path", "header", "cookie"}:
        parts = parts[1:]
    return ".".join(parts)


async def _domain_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, DomainError)
    return error_response(
        _DOMAIN_STATUS.get(exc.code, _DEFAULT_DOMAIN_STATUS), exc.code, exc.message, exc.details
    )


async def _validation_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    fields = [
        {"field": _field_name(tuple(err.get("loc", ()))), "message": err.get("msg", "")}
        for err in exc.errors()
    ]
    return error_response(422, VALIDACION, "Hay campos faltantes o inválidos.", {"fields": fields})


async def _http_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    code, message = _HTTP_CODES.get(exc.status_code, (f"HTTP_{exc.status_code}", str(exc.detail)))
    response = error_response(exc.status_code, code, message)
    if exc.headers:
        response.headers.update(exc.headers)
    return response


async def _unhandled_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.error("Error no controlado", exc_info=exc)
    return error_response(500, ERROR_INTERNO, "Ocurrió un error inesperado.")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(DomainError, _domain_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
    app.add_exception_handler(StarletteHTTPException, _http_error_handler)
    app.add_exception_handler(Exception, _unhandled_error_handler)
