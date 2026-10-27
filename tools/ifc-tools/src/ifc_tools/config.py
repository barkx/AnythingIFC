"""Settings from environment variables, optionally loaded from tools/ifc-tools/.env."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

PACKAGE_ROOT = Path(__file__).resolve().parents[2]  # tools/ifc-tools


@dataclass(frozen=True)
class Settings:
    app_url: str
    admin_token: str | None
    data_dir: Path

    @property
    def jobs_dir(self) -> Path:
        return self.data_dir / "jobs"


def load_settings() -> Settings:
    load_dotenv(PACKAGE_ROOT / ".env")
    return Settings(
        app_url=os.environ.get("IFCWISE_APP_URL", "http://localhost:3001").rstrip("/"),
        admin_token=os.environ.get("IFCWISE_ADMIN_TOKEN") or None,
        data_dir=Path(os.environ.get("IFCWISE_DATA_DIR", r"C:\IFCWiseData")),
    )
