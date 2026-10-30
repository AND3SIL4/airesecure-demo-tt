"""Base de los DTOs de la API: JSON en camelCase (doc 08 §1)."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class ErrorDetail(ApiModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)


class ErrorBody(ApiModel):
    """Formato común de error: `{ "error": { "code", "message", "details" } }`."""

    error: ErrorDetail
