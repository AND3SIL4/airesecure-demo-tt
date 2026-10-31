"""Plantillas de descripción de las alertas (doc 10 §5). Tono sin certeza: es una predicción demostrativa.

Variables disponibles: `{zona}`, `{fuente}`, `{min}` y `{n}`.
"""

from typing import Any

DESCRIPTION_TEMPLATES: dict[str, list[str]] = {
    "equipaje_abandonado": [
        "Posible equipaje sin supervisión detectado en {zona} durante más de {min} min.",
        "Posible maleta sin propietario visible cerca de {fuente} desde hace {min} min.",
        "Posible bulto inmóvil sin persona asociada en {zona}; permanece más de {min} min.",
        "Posible equipaje desatendido junto a un área de asientos de {zona}.",
    ],
    "objeto_inusual": [
        "Objeto no habitual detectado por {fuente} cerca del área de tránsito.",
        "Posible objeto de forma no habitual en {zona}; requiere verificación visual.",
        "Posible objeto fuera de lugar detectado por {fuente} en {zona}.",
    ],
    "acceso_restringido": [
        "Apertura de acceso sin credencial válida registrada por {fuente}.",
        "Posible ingreso a {zona} sin autorización registrada.",
        "Posible acceso por {fuente} fuera del horario autorizado.",
    ],
    "comportamiento_anomalo": [
        "Patrón de movimiento atípico detectado en {zona}.",
        "Posible recorrido repetitivo en {zona} durante los últimos {min} min.",
        "Posible movimiento contra el flujo habitual detectado por {fuente}.",
    ],
    "concentracion_personas": [
        "Concentración de aproximadamente {n} personas, por encima del promedio de {zona}.",
        "Posible aglomeración de unas {n} personas detectada por {fuente}.",
        "Posible ocupación superior a la habitual en {zona} (≈ {n} personas).",
    ],
    "permanencia_inusual": [
        "Permanencia prolongada en {zona} superior al umbral configurado.",
        "Posible permanencia de más de {min} min en un mismo punto de {zona}.",
        "Posible espera inusualmente larga detectada por {fuente}.",
    ],
    "reporte_operador": [
        "Reporte de operador: posible situación que requiere verificación en {zona}.",
        "Reporte de operador: posible pasajero con dificultades cerca de {zona}.",
        "Reporte de operador: posible discusión entre pasajeros en {zona}.",
    ],
}


def render(type_code: str, idx: int, **variables: Any) -> str:
    """Devuelve la plantilla `idx` (cíclica) del tipo con las variables sustituidas."""
    templates = DESCRIPTION_TEMPLATES[type_code]
    return templates[idx % len(templates)].format(**variables)
