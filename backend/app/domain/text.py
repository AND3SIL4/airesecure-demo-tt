"""Utilidades puras de texto para consultas."""

LIKE_ESCAPE = "\\"


def escape_like(value: str) -> str:
    """Escapa los comodines de LIKE (`%`, `_`) y el carácter de escape, para buscar texto literal."""
    return (
        value.replace(LIKE_ESCAPE, LIKE_ESCAPE * 2)
        .replace("%", LIKE_ESCAPE + "%")
        .replace("_", LIKE_ESCAPE + "_")
    )
