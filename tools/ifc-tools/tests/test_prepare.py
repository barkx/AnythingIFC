import json
from pathlib import Path

import ezdxf
import pymupdf

from ifc_tools.prepare import extract_dxf, prepare

JOB = {
    "id": "abcdefgh23",
    "title": "Test house",
    "description": "Two storeys, gable roof.",
    "buildingType": "house",
    "storeys": 2,
    "approxAreaM2": 120,
    "units": "m",
    "inputs": [
        {"filename": "plan.dxf", "contentType": "application/dxf"},
        {"filename": "set.pdf", "contentType": "application/pdf"},
        {"filename": "notes.txt", "contentType": "text/plain"},
        {"filename": "old.dwg", "contentType": "application/acad"},
    ],
}


def make_dxf(path: Path) -> None:
    doc = ezdxf.new(units=6)  # metres
    msp = doc.modelspace()
    doc.layers.add("WALLS")
    msp.add_lwpolyline(
        [(0, 0), (10, 0), (10, 12), (0, 12)], close=True, dxfattribs={"layer": "WALLS"}
    )
    msp.add_line((5, 0), (5, 12), dxfattribs={"layer": "WALLS"})
    msp.add_text("Living", dxfattribs={"layer": "TEXT", "height": 0.3}).set_placement((2, 6))
    doc.saveas(path)


def make_pdf(path: Path, pages: int = 2) -> None:
    doc = pymupdf.open()
    for n in range(pages):
        doc.new_page().insert_text((72, 72), f"Floor plan page {n + 1}")
    doc.save(path)


def test_extract_dxf(tmp_path: Path):
    make_dxf(tmp_path / "plan.dxf")
    data = extract_dxf(tmp_path / "plan.dxf")
    assert data["units"] == "m"
    walls = data["layers"]["WALLS"]
    assert walls["polylines"][0] == {"closed": True, "points": [[0, 0], [10, 0], [10, 12], [0, 12]]}
    assert walls["lines"] == [[5, 0, 5, 12]]
    assert data["layers"]["TEXT"]["texts"][0]["text"] == "Living"
    assert data["extents"] == [[0, 0], [10, 12]]


def test_prepare_job_folder(tmp_path: Path, monkeypatch):
    monkeypatch.delenv("ODA_CONVERTER", raising=False)
    (tmp_path / "input").mkdir()
    make_dxf(tmp_path / "input" / "plan.dxf")
    make_pdf(tmp_path / "input" / "set.pdf")
    (tmp_path / "input" / "notes.txt").write_text("Wall height 2.8 m", encoding="utf-8")
    (tmp_path / "input" / "old.dwg").write_bytes(b"AC1032")
    (tmp_path / "job.json").write_text(json.dumps(JOB), encoding="utf-8")

    report = prepare(tmp_path)

    assert report.geometry == ["prepared/plan.geometry.json"]
    assert report.pages == ["prepared/pages/set-p1.png", "prepared/pages/set-p2.png"]
    assert report.texts == {"notes.txt": "Wall height 2.8 m"}
    assert any("old.dwg" in n and "ODA_CONVERTER" in n for n in report.notes)
    for folder in ("prepared", "output", "revit", "bonsai"):
        assert (tmp_path / folder).is_dir()

    prompt = (tmp_path / "PROMPT.md").read_text(encoding="utf-8")
    assert "# IFCWise job abcdefgh23 — Test house" in prompt
    assert "`prepared/plan.geometry.json`" in prompt
    assert "Wall height 2.8 m" in prompt
    assert "validate abcdefgh23" in prompt


def test_prepare_without_job_json_fails(tmp_path: Path):
    (tmp_path / "input").mkdir()
    try:
        prepare(tmp_path)
    except FileNotFoundError as error:
        assert "pull" in str(error)
    else:
        raise AssertionError("expected FileNotFoundError")


def test_prepare_with_minimal_job(tmp_path: Path):
    # Real job.json files omit optional fields the creator left empty.
    (tmp_path / "input").mkdir()
    minimal = {"id": "abcdefgh23", "title": "Minimal", "description": "Just text.", "inputs": []}
    (tmp_path / "job.json").write_text(json.dumps(minimal), encoding="utf-8")
    prepare(tmp_path)
    prompt = (tmp_path / "PROMPT.md").read_text(encoding="utf-8")
    assert "Building type: not given" in prompt
    assert "No files" in prompt
