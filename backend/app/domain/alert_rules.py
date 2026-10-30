"""Reglas de validación de textos y del motivo de descarte de la alerta (doc 05 §2 y §4.3)."""

from app.domain.enums import DismissReason

NOTE_MAX = 500
COMMENT_MIN = 3
COMMENT_MAX = 500
DISMISS_OTHER_MIN = 10
DISMISS_COMMENT_MAX = 500
DESCRIPTION_MIN = 10
DESCRIPTION_MAX = 500

FieldError = dict[str, str]


def _length_error(field: str, value: str, min_len: int, max_len: int) -> FieldError | None:
    if len(value) < min_len:
        return {"field": field, "message": f"Debe tener al menos {min_len} caracteres."}
    if len(value) > max_len:
        return {"field": field, "message": f"Debe tener como máximo {max_len} caracteres."}
    return None


def validate_note(note: str | None) -> list[FieldError]:
    if note and len(note) > NOTE_MAX:
        return [{"field": "note", "message": f"Debe tener como máximo {NOTE_MAX} caracteres."}]
    return []


def validate_comment(comment: str | None) -> list[FieldError]:
    if not comment:
        return [{"field": "comment", "message": "Este campo es obligatorio."}]
    error = _length_error("comment", comment, COMMENT_MIN, COMMENT_MAX)
    return [error] if error else []


def validate_dismiss(reason: str | None, comment: str | None) -> list[FieldError]:
    """El motivo debe ser del catálogo; `otro` exige un comentario de al menos 10 caracteres."""
    if not reason:
        return [{"field": "reason", "message": "Selecciona un motivo."}]
    if reason not in {r.value for r in DismissReason}:
        return [{"field": "reason", "message": "Valor no permitido."}]
    if reason == DismissReason.OTRO:
        if not comment:
            return [{"field": "comment", "message": "Describe el motivo (al menos 10 caracteres)."}]
        error = _length_error("comment", comment, DISMISS_OTHER_MIN, DISMISS_COMMENT_MAX)
        return [error] if error else []
    if comment and len(comment) > DISMISS_COMMENT_MAX:
        return [{"field": "comment", "message": f"Debe tener como máximo {DISMISS_COMMENT_MAX} caracteres."}]
    return []


def validate_description(description: str | None) -> list[FieldError]:
    if not description:
        return [{"field": "description", "message": "Este campo es obligatorio."}]
    error = _length_error("description", description, DESCRIPTION_MIN, DESCRIPTION_MAX)
    return [error] if error else []
