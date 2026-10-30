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


class AlertStatus(StrEnum):
    NUEVA = "nueva"
    EN_REVISION = "en_revision"
    CONFIRMADA = "confirmada"
    DESCARTADA = "descartada"


class IncidentStatus(StrEnum):
    ABIERTO = "abierto"
    EN_ATENCION = "en_atencion"
    ESCALADO = "escalado"
    RESUELTO = "resuelto"


class AlertOrigin(StrEnum):
    SEED = "seed"
    SIMULADOR = "simulador"
    ESCENARIO = "escenario"
    MANUAL = "manual"


class AlertAction(StrEnum):
    REVIEW = "review"
    CONFIRM = "confirm"
    DISMISS = "dismiss"
    COMMENT = "comment"


class TimelineAction(StrEnum):
    CREATED = "created"
    REVIEW = "review"
    CONFIRM = "confirm"
    DISMISS = "dismiss"
    COMMENT = "comment"
    INCIDENT_CREATED = "incident_created"
    ASSIGN = "assign"
    START = "start"
    ESCALATE = "escalate"
    RESOLVE = "resolve"
    DEMO_RESET = "demo_reset"
    SCENARIO_TRIGGERED = "scenario_triggered"
    SETTINGS_UPDATED = "settings_updated"
