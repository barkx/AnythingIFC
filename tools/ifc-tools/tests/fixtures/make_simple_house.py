"""Generate simple-house.ifc: a 10 x 12 m two-storey box used to test the viewer and `validate`.

Run: uv run --project tools/ifc-tools python tools/ifc-tools/tests/fixtures/make_simple_house.py
"""

import math
from pathlib import Path

import ifcopenshell.api as api
import ifcopenshell.api.aggregate
import ifcopenshell.api.context
import ifcopenshell.api.geometry
import ifcopenshell.api.project
import ifcopenshell.api.root
import ifcopenshell.api.spatial
import ifcopenshell.api.unit
import numpy as np

WIDTH, DEPTH, STOREY_HEIGHT, WALL, SLAB = 10.0, 12.0, 3.0, 0.3, 0.2


def placement(x: float, y: float, z: float, angle_deg: float = 0.0) -> np.ndarray:
    a = math.radians(angle_deg)
    m = np.eye(4)
    m[0][0], m[0][1], m[1][0], m[1][1] = math.cos(a), -math.sin(a), math.sin(a), math.cos(a)
    m[0][3], m[1][3], m[2][3] = x, y, z
    return m


def main() -> Path:
    f = api.project.create_file(version="IFC4")
    project = api.root.create_entity(f, ifc_class="IfcProject", name="Simple house (test fixture)")
    length = api.unit.add_si_unit(f, unit_type="LENGTHUNIT")
    area = api.unit.add_si_unit(f, unit_type="AREAUNIT")
    volume = api.unit.add_si_unit(f, unit_type="VOLUMEUNIT")
    api.unit.assign_unit(f, units=[length, area, volume])
    model = api.context.add_context(f, context_type="Model")
    body = api.context.add_context(
        f, context_type="Model", context_identifier="Body", target_view="MODEL_VIEW", parent=model
    )

    site = api.root.create_entity(f, ifc_class="IfcSite", name="Site")
    building = api.root.create_entity(f, ifc_class="IfcBuilding", name="House")
    api.aggregate.assign_object(f, products=[site], relating_object=project)
    api.aggregate.assign_object(f, products=[building], relating_object=site)

    def add(product, representation, matrix, container):
        api.geometry.assign_representation(f, product=product, representation=representation)
        api.geometry.edit_object_placement(f, product=product, matrix=matrix)
        api.spatial.assign_container(f, products=[product], relating_structure=container)

    outline = [(0.0, 0.0), (WIDTH, 0.0), (WIDTH, DEPTH), (0.0, DEPTH)]
    for level, name in enumerate(["Ground Floor", "First Floor"]):
        z = level * STOREY_HEIGHT
        storey = api.root.create_entity(f, ifc_class="IfcBuildingStorey", name=name)
        storey.Elevation = z
        api.aggregate.assign_object(f, products=[storey], relating_object=building)

        slab = api.root.create_entity(f, ifc_class="IfcSlab", name=f"{name} slab", predefined_type="FLOOR")
        add(slab, api.geometry.add_slab_representation(f, context=body, depth=SLAB, polyline=outline), placement(0, 0, z), storey)

        walls = [((0, 0), 0, WIDTH), ((WIDTH, 0), 90, DEPTH), ((WIDTH, DEPTH), 180, WIDTH), ((0, DEPTH), 270, DEPTH)]
        for i, ((x, y), angle, wall_length) in enumerate(walls, start=1):
            wall = api.root.create_entity(f, ifc_class="IfcWall", name=f"{name} wall {i}")
            rep = api.geometry.add_wall_representation(
                f, context=body, length=wall_length, height=STOREY_HEIGHT - SLAB, thickness=WALL
            )
            add(wall, rep, placement(x, y, z + SLAB, angle), storey)

        partition = api.root.create_entity(f, ifc_class="IfcWall", name=f"{name} partition")
        rep = api.geometry.add_wall_representation(f, context=body, length=DEPTH, height=STOREY_HEIGHT - SLAB, thickness=0.12)
        add(partition, rep, placement(WIDTH / 2, 0, z + SLAB, 90), storey)

        for room in ("Living", "Kitchen") if level == 0 else ("Bedroom 1", "Bedroom 2"):
            space = api.root.create_entity(f, ifc_class="IfcSpace", name=room)
            api.aggregate.assign_object(f, products=[space], relating_object=storey)

    roof = api.root.create_entity(f, ifc_class="IfcSlab", name="Roof", predefined_type="ROOF")
    top = api.root.create_entity(f, ifc_class="IfcBuildingStorey", name="Roof")
    top.Elevation = 2 * STOREY_HEIGHT
    api.aggregate.assign_object(f, products=[top], relating_object=building)
    add(roof, api.geometry.add_slab_representation(f, context=body, depth=SLAB, polyline=outline), placement(0, 0, 2 * STOREY_HEIGHT), top)

    out = Path(__file__).with_name("simple-house.ifc")
    f.write(str(out))
    return out


if __name__ == "__main__":
    print(main())
