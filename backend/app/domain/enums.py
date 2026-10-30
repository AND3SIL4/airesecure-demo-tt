"""Enums del dominio (doc 05). Los valores se persisten como texto."""

from enum import StrEnum


class Severity(StrEnum):
    CRITICA = "critica"
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"


class Role(StrEnum):
    OPERADOR = "operador"
    SUPERVISOR = "supervisor"


class SourceKind(StrEnum):
    CAMARA = "camara"
    SENSOR = "sensor"
    REPORTE_MANUAL = "reporte_manual"
    ANALISIS = "analisis"


class RiskLevel(StrEnum):
    CRITICA = "critica"
    ALTA = "alta"
    MEDIA = "media"
    BAJA = "baja"
    NORMAL = "normal"


class DismissReason(StrEnum):
    PERTENENCIA_PERSONAL = "pertenencia_personal"
    MOVIMIENTO_NORMAL = "movimiento_normal"
    FALLA_CAMARA = "falla_camara"
    PERSONAL_AUTORIZADO = "personal_autorizado"
    OTRO = "otro"
