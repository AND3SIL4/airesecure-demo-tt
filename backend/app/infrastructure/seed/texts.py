"""Reexporta las plantillas de descripción, que viven en el dominio (las usan la siembra y los servicios)."""

from app.domain.alert_texts import DESCRIPTION_TEMPLATES, render

__all__ = ["DESCRIPTION_TEMPLATES", "render"]
