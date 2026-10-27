"""Route B: build an IFC4 model from output/model-spec.json (format below, also in docs/SOP-conversion.md).

The agent describes the building as plain data; this module turns it into valid IFC with storeys, typed walls,
slabs, roof, openings filled by doors/windows and spaces with floor-area quantities.

{
  "project": "Two-storey house",            # optional
  "units": "m",                              # m only for now
  "defaults": {"wallThickness": 0.3, "storeyHeight": 3.0, "slabThickness": 0.2},   # all optional
  "storeys": [
    {
      "name": "Ground Floor", "elevation": 0.0, "height": 3.0,                     # height optional
      "slab": {"outline": [[0, 0], [10, 0], [10, 12], [0, 12]]},                     # optional
      "walls": [
        {"start": [0, 0], "end": [10, 0], "thickness": 0.3, "name": "W1",          # wall centre line
         "openings": [
           {"type": "door", "offset": 2.0, "width": 0.9, "height": 2.1},            # offset from start
           {"type": "window", "offset": 5.0, "width": 1.2, "height": 1.2, "sill": 0.9}
         ]}
      ],
      "spaces": [{"name": "Living", "outline": [[0.15, 0.15], [5, 0.15], [5, 11.85], [0.15, 11.85]]}]
    }
  ],
  "roof": {"outline": [[0, 0], [10, 0], [10, 12], [0, 12]], "elevation": 6.0, "thickness": 0.2}   # flat, optional
}
"""

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import ifcopenshell
import numpy as np
from ifcopenshell.api import (
    aggregate,
    context,
    feature,
    geometry,
    project,
    pset,
    root,
    spatial,
    unit,
)
from ifcopenshell.api import type as ifc_type

Point = tuple[float, float]


class SpecError(ValueError):
    pass


@dataclass
class Defaults:
    wall_thickness: float = 0.3
    storey_height: float = 3.0
    slab_thickness: float = 0.2


def _num(data: dict, key: str, default: float | None = None, where: str = "") -> float:
    value = data.get(key, default)
    if value is None:
        raise SpecError(f"{where}: '{key}' is required")
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise SpecError(f"{where}: '{key}' must be a number")
    return float(value)


def _point(value: Any, where: str) -> Point:
    if not (
        isinstance(value, (list, tuple))
        and len(value) == 2
        and all(isinstance(v, (int, float)) for v in value)
    ):
        raise SpecError(f"{where}: expected [x, y]")
    return float(value[0]), float(value[1])


def _outline(value: Any, where: str) -> list[Point]:
    if not isinstance(value, list) or len(value) < 3:
        raise SpecError(f"{where}: outline needs at least 3 points")
    return [_point(p, f"{where}[{i}]") for i, p in enumerate(value)]


def _polygon_area(points: list[Point]) -> float:
    return (
        abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1])))
        / 2
    )


def _matrix(x: float, y: float, z: float, angle: float = 0.0) -> np.ndarray:
    m = np.eye(4)
    c, s = math.cos(angle), math.sin(angle)
    m[0][0], m[0][1], m[1][0], m[1][1] = c, -s, s, c
    m[0][3], m[1][3], m[2][3] = x, y, z
    return m


class Builder:
    def __init__(self, name: str):
        self.f = project.create_file(version="IFC4")
        self.project = root.create_entity(self.f, ifc_class="IfcProject", name=name)
        units = [
            unit.add_si_unit(self.f, unit_type=t) for t in ("LENGTHUNIT", "AREAUNIT", "VOLUMEUNIT")
        ]
        unit.assign_unit(self.f, units=units)
        model = context.add_context(self.f, context_type="Model")
        self.body = context.add_context(
            self.f,
            context_type="Model",
            context_identifier="Body",
            target_view="MODEL_VIEW",
            parent=model,
        )
        site = root.create_entity(self.f, ifc_class="IfcSite", name="Site")
        self.building = root.create_entity(self.f, ifc_class="IfcBuilding", name="Building")
        aggregate.assign_object(self.f, products=[site], relating_object=self.project)
        aggregate.assign_object(self.f, products=[self.building], relating_object=site)
        self._types: dict[tuple[str, str], Any] = {}

    def storey(self, name: str, elevation: float):
        storey = root.create_entity(self.f, ifc_class="IfcBuildingStorey", name=name)
        storey.Elevation = elevation
        aggregate.assign_object(self.f, products=[storey], relating_object=self.building)
        return storey

    def _type(self, ifc_class: str, name: str):
        key = (ifc_class, name)
        if key not in self._types:
            self._types[key] = root.create_entity(self.f, ifc_class=ifc_class, name=name)
        return self._types[key]

    def _place(self, product, representation, matrix, container=None):
        geometry.assign_representation(self.f, product=product, representation=representation)
        geometry.edit_object_placement(self.f, product=product, matrix=matrix)
        if container is not None:
            spatial.assign_container(self.f, products=[product], relating_structure=container)

    def slab(
        self, storey, outline: list[Point], z: float, thickness: float, predefined: str, name: str
    ):
        slab = root.create_entity(
            self.f, ifc_class="IfcSlab", name=name, predefined_type=predefined
        )
        rep = geometry.add_slab_representation(
            self.f, context=self.body, depth=thickness, polyline=outline
        )
        self._place(slab, rep, _matrix(0, 0, z), storey)
        label = "Roof" if predefined == "ROOF" else "Floor"
        ifc_type.assign_type(
            self.f,
            related_objects=[slab],
            relating_type=self._type("IfcSlabType", f"{label} {round(thickness * 1000)} mm"),
        )
        return slab

    def wall(
        self, storey, start: Point, end: Point, z: float, height: float, thickness: float, name: str
    ):
        dx, dy = end[0] - start[0], end[1] - start[1]
        length = math.hypot(dx, dy)
        if length < 0.01:
            raise SpecError(f"{name}: wall is shorter than 1 cm")
        angle = math.atan2(dy, dx)
        wall = root.create_entity(
            self.f, ifc_class="IfcWall", name=name, predefined_type="STANDARD"
        )
        rep = geometry.add_wall_representation(
            self.f,
            context=self.body,
            length=length,
            height=height,
            thickness=thickness,
            offset=-thickness / 2,
        )
        matrix = _matrix(start[0], start[1], z, angle)
        self._place(wall, rep, matrix, storey)
        ifc_type.assign_type(
            self.f,
            related_objects=[wall],
            relating_type=self._type("IfcWallType", f"Wall {round(thickness * 1000)} mm"),
        )
        return wall, matrix, length

    def opening(self, storey, wall, wall_matrix, wall_length, thickness, spec: dict, where: str):
        kind = spec.get("type")
        if kind not in ("door", "window"):
            raise SpecError(f"{where}: type must be 'door' or 'window'")
        width = _num(spec, "width", 0.9 if kind == "door" else 1.2, where)
        height = _num(spec, "height", 2.1 if kind == "door" else 1.2, where)
        sill = _num(spec, "sill", 0.0 if kind == "door" else 0.9, where)
        offset = _num(spec, "offset", None, where)
        if offset < 0 or offset + width > wall_length + 1e-6:
            raise SpecError(
                f"{where}: opening ({offset} + {width} m) doesn't fit in the {wall_length:.2f} m wall"
            )

        # The void: a box slightly thicker than the wall so it cuts cleanly through.
        local = np.eye(4)
        local[0][3], local[1][3], local[2][3] = offset, -thickness / 2 - 0.01, sill
        void = root.create_entity(self.f, ifc_class="IfcOpeningElement", name=f"{where} void")
        rep = geometry.add_wall_representation(
            self.f, context=self.body, length=width, height=height, thickness=thickness + 0.02
        )
        self._place(void, rep, wall_matrix @ local)
        feature.add_feature(self.f, feature=void, element=wall)

        ifc_class = "IfcDoor" if kind == "door" else "IfcWindow"
        filling = root.create_entity(
            self.f, ifc_class=ifc_class, name=spec.get("name", where), predefined_type=kind.upper()
        )
        filling.OverallWidth, filling.OverallHeight = width, height
        if kind == "door":
            rep = geometry.add_door_representation(
                self.f, context=self.body, overall_height=height, overall_width=width
            )
        else:
            rep = geometry.add_window_representation(
                self.f, context=self.body, overall_height=height, overall_width=width
            )
        local[1][3] = -thickness / 2 + 0.05  # set the frame just inside the wall face
        self._place(filling, rep, wall_matrix @ local, storey)
        type_name = (
            f"{'Door' if kind == 'door' else 'Window'} {round(width * 1000)}x{round(height * 1000)}"
        )
        ifc_type.assign_type(
            self.f,
            related_objects=[filling],
            relating_type=self._type(f"{ifc_class}Type", type_name),
        )
        feature.add_filling(self.f, opening=void, element=filling)

    def space(self, storey, name: str, outline: list[Point], z: float, height: float):
        space = root.create_entity(self.f, ifc_class="IfcSpace", name=name)
        rep = geometry.add_slab_representation(
            self.f, context=self.body, depth=height, polyline=outline
        )
        geometry.assign_representation(self.f, product=space, representation=rep)
        geometry.edit_object_placement(self.f, product=space, matrix=_matrix(0, 0, z))
        aggregate.assign_object(self.f, products=[space], relating_object=storey)
        area = round(_polygon_area(outline), 3)
        qto = pset.add_qto(self.f, product=space, name="Qto_SpaceBaseQuantities")
        pset.edit_qto(
            self.f,
            qto=qto,
            properties={"NetFloorArea": area, "GrossFloorArea": area, "Height": height},
        )


def build(spec: dict) -> ifcopenshell.file:
    if spec.get("units", "m") != "m":
        raise SpecError("Only metre models are supported (units: 'm').")
    d = spec.get("defaults", {})
    defaults = Defaults(
        wall_thickness=_num(d, "wallThickness", 0.3, "defaults"),
        storey_height=_num(d, "storeyHeight", 3.0, "defaults"),
        slab_thickness=_num(d, "slabThickness", 0.2, "defaults"),
    )
    storeys = spec.get("storeys")
    if not isinstance(storeys, list) or not storeys:
        raise SpecError("'storeys' must be a non-empty list")

    b = Builder(spec.get("project") or "IFCWise model")
    top = None
    for si, s in enumerate(storeys):
        where = f"storeys[{si}]"
        name = s.get("name") or f"Level {si}"
        elevation = _num(s, "elevation", si * defaults.storey_height, where)
        height = _num(s, "height", defaults.storey_height, where)
        storey = b.storey(name, elevation)
        top = (storey, elevation + height)

        slab_spec = s.get("slab")
        slab_t = defaults.slab_thickness
        if slab_spec:
            slab_t = _num(slab_spec, "thickness", defaults.slab_thickness, f"{where}.slab")
            b.slab(
                storey,
                _outline(slab_spec.get("outline"), f"{where}.slab"),
                elevation,
                slab_t,
                "FLOOR",
                f"{name} slab",
            )
        wall_base, wall_height = (
            elevation + (slab_t if slab_spec else 0),
            height - (slab_t if slab_spec else 0),
        )

        for wi, w in enumerate(s.get("walls", [])):
            wwhere = f"{where}.walls[{wi}]"
            thickness = _num(w, "thickness", defaults.wall_thickness, wwhere)
            wall, matrix, length = b.wall(
                storey,
                _point(w.get("start"), f"{wwhere}.start"),
                _point(w.get("end"), f"{wwhere}.end"),
                wall_base,
                _num(w, "height", wall_height, wwhere),
                thickness,
                w.get("name") or f"{name} wall {wi + 1}",
            )
            for oi, o in enumerate(w.get("openings", [])):
                b.opening(storey, wall, matrix, length, thickness, o, f"{wwhere}.openings[{oi}]")

        for pi, sp in enumerate(s.get("spaces", [])):
            pwhere = f"{where}.spaces[{pi}]"
            b.space(
                storey,
                sp.get("name") or f"Room {pi + 1}",
                _outline(sp.get("outline"), pwhere),
                wall_base,
                wall_height,
            )

    roof = spec.get("roof")
    if roof:
        outline = _outline(roof.get("outline"), "roof")
        elevation = _num(roof, "elevation", top[1], "roof")
        thickness = _num(roof, "thickness", defaults.slab_thickness, "roof")
        roof_storey = b.storey("Roof", elevation)
        b.slab(roof_storey, outline, elevation, thickness, "ROOF", "Roof")
    return b.f


def build_job(job_dir: Path) -> Path:
    spec_path = job_dir / "output" / "model-spec.json"
    if not spec_path.exists():
        raise FileNotFoundError(
            f"{spec_path} is missing - write the model spec first (see docs/SOP-conversion.md)."
        )
    try:
        spec = json.loads(spec_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise SpecError(f"model-spec.json is not valid JSON: {error}") from error
    target = job_dir / "output" / "model.ifc"
    build(spec).write(str(target))
    return target
