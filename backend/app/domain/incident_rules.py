"""Reglas de contenido de las acciones del incidente (doc 05 §3, specs/004-incidentes/data-model.md)."""

from app.domain.alert_rules import FieldError
from app.domain.errors import EQUIPO_REQUERIDO, DomainError

REASON_MIN = 10
REASON_MAX = 500
NOTE_MIN = 10
NOTE_MAX = 500
COMMENT_MIN = 3
COMMENT_MAX = 500

MSG_TEAM_REQUIRED = "Asigna un equipo antes de iniciar la atención."
MSG_TEAM_NOT_SPECIALIZED = "Solo se puede escalar a un equipo especializado."
MSG_TEAM_NOT_FOUND = "El equipo no existe."
MSG_REASON_SHORT = f"El motivo debe tener al menos {REASON_MIN} caracteres."
MSG_NOTE_SHORT = f"La nota de cierre debe tener al menos {NOTE_MIN} caracteres."


def _too_long(field: str, value: str | None, max_len: int) -> FieldError | None:
    if value and len(value) > max_len:
        return {"field": field, "message": f"Debe tener como máximo {max_len} caracteres."}
    return None


def validate_team_exists(team_exists: bool) -> list[FieldError]:
    return [] if team_exists else [{"field": "teamId", "message": MSG_TEAM_NOT_FOUND}]


def validate_assign(team_exists: bool, comment: str | None) -> list[FieldError]:
    """`assign`: el equipo debe existir y el comentario es opcional (≤ 500)."""
    errors = validate_team_exists(team_exists)
    error = _too_long("comment", comment, COMMENT_MAX)
    return errors + ([error] if error else [])


def validate_escalate(team_exists: bool, team_specialized: bool, reason: str | None) -> list[FieldError]:
    """`escalate`: equipo especializado y motivo de 10 a 500 caracteres."""
    errors: list[FieldError] = []
    if not team_exists:
        errors.append({"field": "teamId", "message": MSG_TEAM_NOT_FOUND})
    elif not team_specialized:
        errors.append({"field": "teamId", "message": MSG_TEAM_NOT_SPECIALIZED})
    if not reason or len(reason) < REASON_MIN:
        errors.append({"field": "reason", "message": MSG_REASON_SHORT})
    else:
        error = _too_long("reason", reason, REASON_MAX)
        if error:
            errors.append(error)
    return errors


def validate_resolve(note: str | None) -> list[FieldError]:
    """`resolve`: nota de cierre de 10 a 500 caracteres."""
    if not note or len(note) < NOTE_MIN:
        return [{"field": "note", "message": MSG_NOTE_SHORT}]
    error = _too_long("note", note, NOTE_MAX)
    return [error] if error else []


def validate_comment(comment: str | None) -> list[FieldError]:
    """`comment`: texto de 3 a 500 caracteres."""
    if not comment:
        return [{"field": "comment", "message": "Este campo es obligatorio."}]
    if len(comment) < COMMENT_MIN:
        return [{"field": "comment", "message": f"Debe tener al menos {COMMENT_MIN} caracteres."}]
    error = _too_long("comment", comment, COMMENT_MAX)
    return [error] if error else []


def ensure_team_for_start(team_id: str | None) -> None:
    """`start` requiere un equipo asignado (422 `EQUIPO_REQUERIDO`)."""
    if not team_id:
        raise DomainError(EQUIPO_REQUERIDO, MSG_TEAM_REQUIRED)
