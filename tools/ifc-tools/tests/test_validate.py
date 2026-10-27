import json
import shutil
from pathlib import Path

from ifcopenshell.api import project, root

from ifc_tools.validate import validate, validate_file

FIXTURE = Path(__file__).parent / "fixtures" / "simple-house.ifc"


def test_simple_house_passes_with_expected_summary():
    result = validate_file(FIXTURE)
    assert result.ok, result.errors
    assert result.summary["schema"] == "IFC4"
    assert result.summary["counts"] == {"IfcWall": 10, "IfcSpace": 4, "IfcSlab": 3}
    assert [s["name"] for s in result.summary["storeys"]] == ["Ground Floor", "First Floor", "Roof"]
    assert result.summary["storeys"][0]["counts"] == {"IfcSlab": 1, "IfcWall": 5, "IfcSpace": 2}
    assert any("openings" in w for w in result.warnings)


def test_feet_project_flags_metre_model():
    result = validate_file(FIXTURE, expected_units="ft")
    assert not result.ok
    assert any("unit scale" in e for e in result.errors)


def test_empty_model_fails(tmp_path: Path):
    f = project.create_file(version="IFC4")
    root.create_entity(f, ifc_class="IfcProject", name="Empty")
    path = tmp_path / "empty.ifc"
    f.write(str(path))

    result = validate_file(path)
    assert not result.ok
    assert any("IfcSite" in e for e in result.errors)
    assert any("IfcWall" in e for e in result.errors)


def test_garbage_file_fails(tmp_path: Path):
    path = tmp_path / "bad.ifc"
    path.write_text("not an ifc file")
    result = validate_file(path)
    assert not result.ok and "parsed" in result.errors[0]


def test_validate_job_writes_summary(tmp_path: Path):
    (tmp_path / "output").mkdir()
    shutil.copy(FIXTURE, tmp_path / "output" / "model.ifc")
    (tmp_path / "job.json").write_text(json.dumps({"units": "m"}))

    result = validate(tmp_path)
    assert result.ok
    summary = json.loads((tmp_path / "output" / "summary.json").read_text(encoding="utf-8"))
    assert summary["counts"]["IfcWall"] == 10
