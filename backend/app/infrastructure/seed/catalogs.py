"""Datos semilla de catálogos (specs/001-fundacion/data-model.md y doc 07 §3)."""

from typing import TypedDict

from app.domain.enums import Role, Severity, SourceKind


class ZoneSeed(TypedDict):
    id: str
    name: str
    criticality: int
    restricted: bool
    x: float
    z: float
    w: float
    d: float
    h: float


class AlertTypeSeed(TypedDict):
    code: str
    name: str
    default_severity: Severity | None
    confidence_threshold: float | None
    scenario_weight: int
    recommendation: str
    protocol: list[str]


class TeamSeed(TypedDict):
    id: str
    name: str
    specialty: str
    specialized: bool


class UserSeed(TypedDict):
    id: str
    alias: str
    role: Role


TERMINAL = "T1"

# Losa de 120 × 80 m centrada en (0,0); +Z apunta hacia la plataforma.
ZONES: list[ZoneSeed] = [
    {"id": "T1-CHECKIN", "name": "Check-in", "criticality": 2, "restricted": False,
     "x": -40, "z": -30, "w": 30, "d": 16, "h": 5},
    {"id": "T1-HALL", "name": "Hall principal", "criticality": 2, "restricted": False,
     "x": 0, "z": -30, "w": 40, "d": 16, "h": 6},
    {"id": "T1-COMERCIAL", "name": "Zona comercial", "criticality": 1, "restricted": False,
     "x": 40, "z": -30, "w": 30, "d": 16, "h": 4},
    {"id": "T1-EQUIPAJES", "name": "Sala de equipajes", "criticality": 3, "restricted": False,
     "x": -52, "z": -5, "w": 16, "d": 30, "h": 4},
    {"id": "T1-SEGURIDAD", "name": "Filtro de seguridad", "criticality": 3, "restricted": False,
     "x": -20, "z": -10, "w": 30, "d": 14, "h": 4},
    {"id": "T1-MIGRACION", "name": "Migración", "criticality": 3, "restricted": False,
     "x": 20, "z": -10, "w": 30, "d": 14, "h": 4},
    {"id": "T1-SERVICIO", "name": "Puerta de servicio", "criticality": 3, "restricted": True,
     "x": 52, "z": -5, "w": 16, "d": 20, "h": 3},
    {"id": "T1-EMBARQUE-A", "name": "Sala de embarque A", "criticality": 2, "restricted": False,
     "x": -22, "z": 12, "w": 36, "d": 18, "h": 5},
    {"id": "T1-PUERTAS", "name": "Puertas 10-14", "criticality": 2, "restricted": False,
     "x": 25, "z": 12, "w": 36, "d": 18, "h": 5},
    {"id": "T1-PLATAFORMA", "name": "Plataforma", "criticality": 3, "restricted": True,
     "x": 0, "z": 32, "w": 110, "d": 14, "h": 0.5},
]  # fmt: skip

# (id de la cámara, zona)
CAMERAS: list[tuple[str, str]] = [
    ("CAM-T1-001", "T1-HALL"),
    ("CAM-T1-002", "T1-HALL"),
    ("CAM-T1-003", "T1-CHECKIN"),
    ("CAM-T1-004", "T1-SEGURIDAD"),
    ("CAM-T1-005", "T1-SEGURIDAD"),
    ("CAM-T1-006", "T1-MIGRACION"),
    ("CAM-T1-007", "T1-MIGRACION"),
    ("CAM-T1-008", "T1-EMBARQUE-A"),
    ("CAM-T1-009", "T1-EMBARQUE-A"),
    ("CAM-T1-010", "T1-PUERTAS"),
    ("CAM-T1-011", "T1-PUERTAS"),
    ("CAM-T1-012", "T1-EQUIPAJES"),
    ("CAM-T1-013", "T1-SERVICIO"),
    ("CAM-T1-014", "T1-COMERCIAL"),
    ("CAM-T1-015", "T1-PLATAFORMA"),
]

# (id del sensor de acceso, zona)
SENSORS: list[tuple[str, str]] = [
    ("SEN-T1-001", "T1-SEGURIDAD"),
    ("SEN-T1-002", "T1-MIGRACION"),
    ("SEN-T1-003", "T1-SERVICIO"),
    ("SEN-T1-004", "T1-SERVICIO"),
    ("SEN-T1-005", "T1-PLATAFORMA"),
]

# (id, tipo, label) de las fuentes lógicas, sin zona.
LOGICAL_SOURCES: list[tuple[str, SourceKind, str]] = [
    ("MANUAL", SourceKind.REPORTE_MANUAL, "Reporte de operador"),
    ("ANALISIS", SourceKind.ANALISIS, "Análisis de patrones"),
]

ALERT_TYPES: list[AlertTypeSeed] = [
    {
        "code": "equipaje_abandonado",
        "name": "Equipaje abandonado",
        "default_severity": Severity.CRITICA,
        "confidence_threshold": 0.80,
        "scenario_weight": 1,
        "recommendation": "Verificar visualmente y activar el protocolo de revisión de equipaje.",
        "protocol": [
            "Verificar con las cámaras cercanas",
            "Enviar a Seguridad T1 a verificar en sitio",
            "Acordonar el área si no aparece el propietario en 5 min",
            "Escalar a la Unidad EOD si el objeto es sospechoso",
        ],
    },
    {
        "code": "objeto_inusual",
        "name": "Objeto inusual",
        "default_severity": Severity.ALTA,
        "confidence_threshold": 0.75,
        "scenario_weight": 2,
        "recommendation": "Confirmar la naturaleza del objeto con una cámara cercana antes de intervenir.",
        "protocol": [
            "Revisar el ángulo alterno de la cámara",
            "Enviar a una patrulla a verificar",
            "Registrar la descripción del objeto",
            "Escalar si no es identificable",
        ],
    },
    {
        "code": "acceso_restringido",
        "name": "Acceso a zona restringida",
        "default_severity": Severity.ALTA,
        "confidence_threshold": 0.70,
        "scenario_weight": 2,
        "recommendation": "Verificar la credencial y la presencia de personal autorizado en el acceso.",
        "protocol": [
            "Consultar el registro del sensor",
            "Revisar la cámara del acceso",
            "Enviar a la patrulla de plataforma",
            "Escalar a la Policía aeroportuaria si no hay autorización",
        ],
    },
    {
        "code": "comportamiento_anomalo",
        "name": "Comportamiento anómalo",
        "default_severity": Severity.MEDIA,
        "confidence_threshold": 0.65,
        "scenario_weight": 3,
        "recommendation": "Observar la evolución del patrón antes de actuar; evitar conclusiones prematuras.",
        "protocol": [
            "Seguir con las cámaras durante 2 min",
            "Informar a Seguridad T1 de la zona",
            "Registrar observaciones",
        ],
    },
    {
        "code": "concentracion_personas",
        "name": "Concentración inusual de personas",
        "default_severity": Severity.MEDIA,
        "confidence_threshold": 0.60,
        "scenario_weight": 3,
        "recommendation": "Evaluar el flujo y coordinar con Operaciones para redistribuir.",
        "protocol": [
            "Verificar la ocupación en la cámara",
            "Coordinar con Operaciones",
            "Habilitar filas o puertas alternas",
            "Monitorear 10 min",
        ],
    },
    {
        "code": "permanencia_inusual",
        "name": "Permanencia inusual",
        "default_severity": Severity.BAJA,
        "confidence_threshold": 0.60,
        "scenario_weight": 4,
        "recommendation": "Confirmar si se trata de un pasajero en espera legítima.",
        "protocol": [
            "Revisar el tiempo de permanencia",
            "Enviar a personal de atención si persiste",
            "Registrar el resultado",
        ],
    },
    {
        "code": "reporte_operador",
        "name": "Incidente reportado por un operador",
        "default_severity": None,
        "confidence_threshold": None,
        "scenario_weight": 0,
        "recommendation": "Validar la información reportada y asignar al equipo adecuado.",
        "protocol": [
            "Confirmar los detalles con quien reporta",
            "Revisar las cámaras de la zona",
            "Asignar el equipo",
        ],
    },
]

# Equipos del doc 07 §3.3.
TEAMS: list[TeamSeed] = [
    {"id": "seg-t1", "name": "Seguridad T1", "specialty": "Seguridad general", "specialized": False},
    {"id": "patrulla", "name": "Patrulla de plataforma", "specialty": "Plataforma", "specialized": False},
    {"id": "operaciones", "name": "Operaciones", "specialty": "Operaciones", "specialized": False},
    {"id": "eod", "name": "Unidad antiexplosivos (EOD)", "specialty": "Explosivos", "specialized": True},
    {"id": "policia", "name": "Policía aeroportuaria", "specialty": "Policial", "specialized": True},
    {"id": "medico", "name": "Servicios médicos", "specialty": "Atención médica", "specialized": True},
]

USERS: list[UserSeed] = [
    {"id": "op-01", "alias": "Operador 01", "role": Role.OPERADOR},
    {"id": "op-02", "alias": "Operador 02", "role": Role.OPERADOR},
    {"id": "sup-a", "alias": "Supervisor A", "role": Role.SUPERVISOR},
]
