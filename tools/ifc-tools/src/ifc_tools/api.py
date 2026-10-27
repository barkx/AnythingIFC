"""Client for the app's admin API (apps/app/src/app/api/admin/*)."""

from pathlib import Path
from typing import Any

import httpx


class ApiError(Exception):
    pass


class AdminApi:
    def __init__(self, app_url: str, token: str, transport: httpx.BaseTransport | None = None):
        self._client = httpx.Client(
            base_url=app_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(30.0, read=300.0),
            follow_redirects=True,
            transport=transport,
        )
        # Blob files are public; never send the admin token to another host.
        self._downloads = httpx.Client(
            timeout=httpx.Timeout(30.0, read=300.0), follow_redirects=True, transport=transport
        )

    def _get_json(self, path: str) -> Any:
        try:
            response = self._client.get(path)
        except httpx.HTTPError as error:
            raise ApiError(f"Could not reach {self._client.base_url}: {error}") from error
        if response.status_code == 401:
            raise ApiError(
                "Unauthorized - check IFCWISE_ADMIN_TOKEN matches the app's ADMIN_API_TOKEN."
            )
        if response.status_code == 404:
            raise ApiError("Project not found.")
        if response.is_error:
            raise ApiError(f"{response.status_code}: {response.text[:300]}")
        return response.json()

    def list_projects(self) -> list[dict[str, Any]]:
        return self._get_json("/api/admin/projects")

    def get_project(self, project_id: str) -> dict[str, Any]:
        return self._get_json(f"/api/admin/projects/{project_id}")

    def download(self, url: str, dest: Path) -> None:
        """Stream a public Blob file to disk."""
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_suffix(dest.suffix + ".part")
        with self._downloads.stream("GET", url) as response:
            if response.is_error:
                raise ApiError(f"Download failed ({response.status_code}): {url}")
            with tmp.open("wb") as fh:
                for chunk in response.iter_bytes():
                    fh.write(chunk)
        tmp.replace(dest)
