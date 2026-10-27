import json
from pathlib import Path

import httpx
import pytest

from ifc_tools.api import AdminApi, ApiError
from ifc_tools.pull import pull

PROJECT = {
    "id": "abcdefgh23",
    "title": "Test house",
    "status": "submitted",
    "inputs": [
        {
            "filename": "plan.dxf",
            "url": "https://store.public.blob.vercel-storage.com/projects/abcdefgh23/input/plan-x1.dxf",
            "size": 5,
        },
        {
            "filename": "plan.dxf",
            "url": "https://store.public.blob.vercel-storage.com/projects/abcdefgh23/input/plan-x2.dxf",
            "size": 5,
        },
    ],
}


def make_api(seen: list[httpx.Request], token: str = "secret") -> AdminApi:
    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        if request.url.host == "app.test":
            if request.headers.get("authorization") != "Bearer secret":
                return httpx.Response(401, json={"error": "Unauthorized"})
            if request.url.path == "/api/admin/projects/abcdefgh23":
                return httpx.Response(200, json=PROJECT)
            return httpx.Response(404, json={"error": "Not found"})
        return httpx.Response(200, content=b"DXF..")

    return AdminApi("https://app.test", token, transport=httpx.MockTransport(handler))


def test_pull_downloads_inputs_and_writes_job(tmp_path: Path):
    seen: list[httpx.Request] = []
    job_dir, downloaded = pull(make_api(seen), tmp_path, "abcdefgh23")

    assert job_dir == tmp_path / "abcdefgh23"
    assert downloaded == ["plan.dxf", "plan-2.dxf"]  # duplicate names don't overwrite each other
    assert (job_dir / "input" / "plan-2.dxf").read_bytes() == b"DXF.."
    job = json.loads((job_dir / "job.json").read_text(encoding="utf-8"))
    assert job["title"] == "Test house" and "pulledAt" in job
    # The admin token must never be sent to the Blob host.
    assert all("authorization" not in r.headers for r in seen if r.url.host != "app.test")


def test_pull_skips_existing_files(tmp_path: Path):
    pull(make_api([]), tmp_path, "abcdefgh23")
    _, downloaded = pull(make_api([]), tmp_path, "abcdefgh23")
    assert downloaded == []


def test_wrong_token_is_reported(tmp_path: Path):
    with pytest.raises(ApiError, match="Unauthorized"):
        pull(make_api([], token="wrong"), tmp_path, "abcdefgh23")


def test_invalid_id_is_rejected(tmp_path: Path):
    with pytest.raises(ValueError):
        pull(make_api([]), tmp_path, "../../etc")
