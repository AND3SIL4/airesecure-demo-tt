"""Configuración estática de la demo: rutas, versión y zona horaria de presentación."""

from pathlib import Path

BASE_DIR: Path = Path(__file__).resolve().parent.parent
DATA_DIR: Path = BASE_DIR / "data"
DB_PATH: Path = DATA_DIR / "aerosecure.db"
APP_VERSION: str = "0.1.0"
DISPLAY_TZ: str = "America/Bogota"
CORS_ORIGINS: list[str] = ["http://localhost:5173"]
