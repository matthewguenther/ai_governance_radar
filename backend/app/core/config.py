"""Application configuration via environment variables (.env supported)."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root = backend/.. when running from a checkout; fall back to cwd.
_BACKEND_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = f"sqlite:///{(_REPO_ROOT / 'data' / 'radar.db').as_posix()}"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"

    scheduler_enabled: bool = False
    default_poll_interval_minutes: int = 360
    fetch_timeout_seconds: int = 20
    fetch_max_bytes: int = 2_000_000
    user_agent: str = "ai-governance-radar/0.1 (+https://github.com/ai-governance-radar)"

    log_level: str = "info"
    demo_data: bool = True

    # Directory containing seed data / source registry YAML (repo data/ by default)
    data_dir: str = str(_REPO_ROOT / "data")
    # Built SPA directory served in production (DEC-017); repo frontend/dist by default
    spa_dir: str = str(_REPO_ROOT / "frontend" / "dist")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
