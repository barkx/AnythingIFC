"""Download a project's inputs from the app into C:\\IFCWiseData\\jobs\\<id>\\."""

import json
import re
from datetime import UTC, datetime
from pathlib import Path

from ifc_tools.api import AdminApi

ID_PATTERN = re.compile(r"^[a-z2-9]{10}$")


def _unique(path: Path, taken: set[Path]) -> Path:
    candidate, n = path, 2
    while candidate in taken:
        candidate = path.with_name(f"{path.stem}-{n}{path.suffix}")
        n += 1
    taken.add(candidate)
    return candidate


def pull(
    api: AdminApi, jobs_dir: Path, project_id: str, force: bool = False
) -> tuple[Path, list[str]]:
    """Returns the job folder and the input files that were downloaded (existing ones are kept)."""
    if not ID_PATTERN.match(project_id):
        raise ValueError(f"'{project_id}' is not a project id (10 characters, a-z and 2-9).")
    project = api.get_project(project_id)
    job_dir = jobs_dir / project_id
    input_dir = job_dir / "input"
    input_dir.mkdir(parents=True, exist_ok=True)

    job = {**project, "pulledAt": datetime.now(UTC).isoformat(timespec="seconds")}
    (job_dir / "job.json").write_text(
        json.dumps(job, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    downloaded: list[str] = []
    taken: set[Path] = set()
    for file in project.get("inputs", []):
        # Filenames are sanitised by the app; keep only the final component to be safe.
        dest = _unique(input_dir / Path(file["filename"]).name, taken)
        if dest.exists() and dest.stat().st_size == file.get("size") and not force:
            continue
        api.download(file["url"], dest)
        downloaded.append(dest.name)
    return job_dir, downloaded
