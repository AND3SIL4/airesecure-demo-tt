"""Utilidades comunes para los parámetros de consulta de los routers."""


def split_list(raw: str | None) -> list[str]:
    """Parámetro de lista separado por comas (`?severity=critica,alta`)."""
    return [part.strip() for part in raw.split(",") if part.strip()] if raw else []
