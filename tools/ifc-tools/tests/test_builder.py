import json
from pathlib import Path

import pytest

from ifc_tools.builder import SpecError, build, build_job
from ifc_tools.validate import validate, validate_file

OUTLINE = [[0, 0], [10, 0], [10, 12], [0, 12]]
SPEC = {
    "project": "Spec house",
    "storeys": [
        {
            "name": "Ground Floor",
            "elevation": 0,
            "slab": {"outline": OUTLINE},
            "walls": [
                {
                    "start": [0, 0],
                    "end": [10, 0],
                    "openings": [{"type": "door", "offset": 2}, {"type": "window", "offset": 5}],
                },
                {"start": [10, 0], "end": [10, 12], "openings": [{"type": "window", "offset": 4}]},
                {"start": [10, 12], "end": [0, 12]},
                {"start": [0, 12], "end": [0, 0]},
            ],
            "spaces": [
                {
                    "name": "Living",
                    "outline": [[0.15, 0.15], [9.85, 0.15], [9.85, 11.85], [0.15, 11.85]],
                }
            ],
        },
        {
            "name": "First Floor",
            "slab": {"outline": OUTLINE},
            "walls": [{"start": [0, 0], "end": [10, 0]}],
        },
    ],
    "roof": {"outline": OUTLINE},
}


def test_spec_builds_a_clean_model(tmp_path: Path):
    path = tmp_path / "model.ifc"
    build(SPEC).write(str(path))
    result = validate_file(path)
    assert result.ok, result.errors
    assert result.warnings == []  # spaces, openings and types are all present
    counts = result.summary["counts"]
    assert counts == {"IfcWall": 5, "IfcSlab": 3, "IfcWindow": 2, "IfcDoor": 1, "IfcSpace": 1}
    assert [s["name"] for s in result.summary["storeys"]] == ["Ground Floor", "First Floor", "Roof"]
    assert result.summary["storeys"][1]["elevation"] == 3.0  # default storey height
    assert result.summary["floorAreaM2"] == pytest.approx(9.7 * 11.7, abs=0.1)


@pytest.mark.parametrize(
    ("change", "message"),
    [
        (lambda s: s.update(storeys=[]), "storeys"),
        (
            lambda s: s["storeys"][0]["walls"][0]["openings"].append(
                {"type": "door", "offset": 9.5}
            ),
            "doesn't fit",
        ),
        (
            lambda s: s["storeys"][0]["walls"][0]["openings"].append(
                {"type": "skylight", "offset": 1}
            ),
            "door' or 'window",
        ),
        (
            lambda s: s["storeys"][0]["walls"].append({"start": [0, 0], "end": [0, 0]}),
            "shorter than 1 cm",
        ),
        (lambda s: s["storeys"][0]["slab"].update(outline=[[0, 0], [1, 1]]), "at least 3 points"),
        (lambda s: s.update(units="ft"), "metre"),
    ],
)
def test_bad_specs_explain_the_problem(change, message):
    spec = json.loads(json.dumps(SPEC))
    change(spec)
    with pytest.raises(SpecError, match=message):
        build(spec)


def test_build_job_writes_model_and_validates(tmp_path: Path):
    (tmp_path / "output").mkdir()
    (tmp_path / "output" / "model-spec.json").write_text(json.dumps(SPEC), encoding="utf-8")
    assert build_job(tmp_path) == tmp_path / "output" / "model.ifc"
    assert validate(tmp_path).ok
