"""Check output/*.ifc against the PoC rules (PLAN.md §8) and write output/summary.json.

summary.json follows the ModelSummary type in packages/shared/src/index.ts.
"""

import json
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import ifcopenshell
import ifcopenshell.util.element as element_util
import ifcopenshell.util.unit as unit_util


@dataclass
class ValidationResult:
    ifc_path: Path
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.errors


def find_ifc(job_dir: Path) -> Path:
    output = job_dir / "output"
    preferred = output / "model.ifc"
    if preferred.exists():
        return preferred
    candidates = sorted(output.glob("*.ifc"))
    if not candidates:
        raise FileNotFoundError(f"No .ifc file in {output}")
    return candidates[0]


def _floor_area(spaces: list) -> float | None:
    total = 0.0
    for space in spaces:
        qto = element_util.get_psets(space, qtos_only=True)
        for values in qto.values():
            area = values.get("NetFloorArea") or values.get("GrossFloorArea")
            if area:
                total += float(area)
                break
    return round(total, 1) if total else None


def validate_file(
    ifc_path: Path, expected_schema: str = "IFC4", expected_units: str = "m"
) -> ValidationResult:
    result = ValidationResult(ifc_path)
    try:
        f = ifcopenshell.open(str(ifc_path))
    except Exception as error:  # noqa: BLE001 — ifcopenshell raises several types for bad files
        result.errors.append(f"File could not be parsed: {error}")
        return result

    if f.schema != expected_schema:
        result.errors.append(f"Schema is {f.schema}, expected {expected_schema}.")

    for ifc_class, rule in (
        ("IfcProject", "exactly one"),
        ("IfcSite", "exactly one"),
        ("IfcBuilding", "at least one"),
        ("IfcBuildingStorey", "at least one"),
    ):
        n = len(f.by_type(ifc_class))
        if (rule == "exactly one" and n != 1) or (rule == "at least one" and n < 1):
            result.errors.append(f"Expected {rule} {ifc_class}, found {n}.")

    scale = unit_util.calculate_unit_scale(f) if f.by_type("IfcProject") else None
    wanted = 1.0 if expected_units == "m" else 0.3048
    if scale is not None and abs(scale - wanted) > 1e-6:
        result.errors.append(
            f"Length unit scale is {scale} m, expected {wanted} ({'metres' if expected_units == 'm' else 'feet'})."
        )

    # Openings are feature elements: they belong to walls, not storeys, and aren't counted.
    elements = [e for e in f.by_type("IfcElement") if not e.is_a("IfcFeatureElement")]
    spaces = list(f.by_type("IfcSpace"))
    if not any(e.is_a("IfcWall") for e in elements):
        result.errors.append("No IfcWall found.")

    uncontained = [
        e
        for e in elements
        if element_util.get_container(e) is None and not element_util.get_aggregate(e)
    ]
    if uncontained:
        names = ", ".join(f"{e.is_a()} #{e.id()}" for e in uncontained[:5])
        result.errors.append(
            f"{len(uncontained)} element(s) not contained in a storey: {names}{' …' if len(uncontained) > 5 else ''}"
        )

    if not spaces:
        result.warnings.append("No IfcSpace (rooms) in the model.")
    if not f.by_type("IfcOpeningElement"):
        result.warnings.append(
            "No openings — doors and windows may be missing or not cut into walls."
        )
    untyped = [e for e in elements if element_util.get_type(e) is None]
    if untyped and len(untyped) == len(elements):
        result.warnings.append("No element has a type (IfcWallType, …).")

    storeys = sorted(f.by_type("IfcBuildingStorey"), key=lambda s: s.Elevation or 0.0)
    per_storey: dict[int, Counter] = {s.id(): Counter() for s in storeys}
    totals: Counter = Counter()
    for item in elements + spaces:
        totals[item.is_a()] += 1
        container = element_util.get_container(item) or (
            element_util.get_aggregate(item) if item.is_a("IfcSpace") else None
        )
        if container is not None and container.id() in per_storey:
            per_storey[container.id()][item.is_a()] += 1

    result.summary = {
        "schema": f.schema,
        "counts": dict(totals.most_common()),
        "storeys": [
            {
                "name": s.Name or f"Storey #{s.id()}",
                "elevation": s.Elevation,
                "counts": dict(per_storey[s.id()]),
            }
            for s in storeys
        ],
        "floorAreaM2": _floor_area(spaces),
        "warnings": result.warnings,
    }
    if result.summary["floorAreaM2"] is None:
        del result.summary["floorAreaM2"]
    return result


def validate(job_dir: Path) -> ValidationResult:
    job_file = job_dir / "job.json"
    job = json.loads(job_file.read_text(encoding="utf-8")) if job_file.exists() else {}
    result = validate_file(find_ifc(job_dir), expected_units=job.get("units", "m"))
    if result.summary:
        (job_dir / "output" / "summary.json").write_text(
            json.dumps(result.summary, indent=2, ensure_ascii=False), encoding="utf-8"
        )
    return result
