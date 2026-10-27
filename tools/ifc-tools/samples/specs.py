"""Reference projects shown on ifcwise.com and in the app gallery.

Each sample is a Route B model spec (see ifc_tools.builder) plus presentation metadata. Exterior wall centre lines
sit half a wall thickness inside the slab edge; rooms are the clear space between wall faces.
"""

from typing import Any

EXT = 0.3  # exterior wall
INT = 0.12  # interior wall


def rect(x0: float, y0: float, x1: float, y1: float) -> list[list[float]]:
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]


def shell(width: float, depth: float, openings: dict[str, list[dict]] | None = None) -> list[dict]:
    """Four exterior walls, counter-clockwise from the front-left corner: front, right, back, left."""
    h = EXT / 2
    o = openings or {}
    return [
        {"name": "Front", "start": [h, h], "end": [width - h, h], "openings": o.get("front", [])},
        {
            "name": "Right",
            "start": [width - h, h],
            "end": [width - h, depth - h],
            "openings": o.get("right", []),
        },
        {
            "name": "Back",
            "start": [width - h, depth - h],
            "end": [h, depth - h],
            "openings": o.get("back", []),
        },
        {"name": "Left", "start": [h, depth - h], "end": [h, h], "openings": o.get("left", [])},
    ]


def wall(
    x0: float, y0: float, x1: float, y1: float, *openings: dict, thickness: float = INT
) -> dict:
    return {"start": [x0, y0], "end": [x1, y1], "thickness": thickness, "openings": list(openings)}


def room(name: str, x0: float, y0: float, x1: float, y1: float) -> dict:
    return {"name": name, "outline": rect(x0, y0, x1, y1)}


def door(offset: float, width: float = 0.9, height: float = 2.1) -> dict:
    return {"type": "door", "offset": offset, "width": width, "height": height}


def window(offset: float, width: float = 1.2, height: float = 1.2, sill: float = 0.9) -> dict:
    return {"type": "window", "offset": offset, "width": width, "height": height, "sill": sill}


def windows(start: float, count: int, spacing: float, **kw: float) -> list[dict]:
    return [window(start + i * spacing, **kw) for i in range(count)]


# --- 1. Family house -------------------------------------------------------------------------------------------
W, D = 11.0, 9.0
e, i = EXT, INT / 2  # wall face offsets
family_house = {
    "project": "Family house",
    "defaults": {"storeyHeight": 3.0},
    "storeys": [
        {
            "name": "Ground Floor",
            "elevation": 0.0,
            "slab": {"outline": rect(0, 0, W, D)},
            "walls": shell(
                W,
                D,
                {
                    "front": [window(1.2, 1.6), window(4.0, 1.6), door(7.4, 1.0, 2.2)],
                    "right": [window(2.0, 1.0), window(5.6, 0.8, 0.8, 1.4)],
                    "back": [window(1.5, 2.4, 2.1, 0.0), window(6.0, 1.6)],
                    "left": [window(3.0, 1.6)],
                },
            )
            + [
                wall(6.5, e, 6.5, D - e, door(1.8), door(5.6)),
                wall(6.5 + i, 4.6, W - e, 4.6, door(1.6, 0.8)),
            ],
            "spaces": [
                room("Living & dining", e, e, 6.5 - i, D - e),
                room("Kitchen", 6.5 + i, e, W - e, 4.6 - i),
                room("Bathroom", 6.5 + i, 4.6 + i, W - e, D - e),
            ],
        },
        {
            "name": "First Floor",
            "elevation": 3.0,
            "slab": {"outline": rect(0, 0, W, D)},
            "walls": shell(
                W,
                D,
                {
                    "front": [window(1.6), window(4.6), window(8.0)],
                    "right": [window(5.6, 0.8, 0.8, 1.4)],
                    "back": [window(1.5, 1.6), window(6.4, 1.6)],
                    "left": [window(3.0)],
                },
            )
            + [
                wall(5.5, e, 5.5, D - e, door(3.5), door(5.0)),
                wall(e, 4.6, 5.5 - i, 4.6, door(3.6)),
                wall(5.5 + i, 4.6, W - e, 4.6, door(1.0, 0.8)),
            ],
            "spaces": [
                room("Bedroom 1", e, e, 5.5 - i, 4.6 - i),
                room("Bedroom 2", e, 4.6 + i, 5.5 - i, D - e),
                room("Study", 5.5 + i, e, W - e, 4.6 - i),
                room("Bathroom", 5.5 + i, 4.6 + i, W - e, D - e),
            ],
        },
    ],
    "roof": {"outline": rect(0, 0, W, D), "thickness": 0.25},
}

# --- 2. Row houses ---------------------------------------------------------------------------------------------
RW, RD = 13.0, 10.0
row_houses = {
    "project": "Row houses",
    "defaults": {"storeyHeight": 2.9},
    "storeys": [
        {
            "name": name,
            "elevation": level * 2.9,
            "slab": {"outline": rect(0, 0, RW, RD)},
            "walls": shell(
                RW,
                RD,
                {
                    "front": (
                        [
                            window(0.8, 1.4),
                            door(3.6, 1.0, 2.2),
                            window(7.2, 1.4),
                            door(10.2, 1.0, 2.2),
                        ]
                        if level == 0
                        else [window(1.0), window(3.8), window(7.4), window(10.2)]
                    ),
                    "back": [
                        window(1.2, 2.0),
                        window(4.2, 1.2),
                        window(7.4, 2.0),
                        window(10.6, 1.2),
                    ],
                },
            )
            + [wall(6.5, e, 6.5, RD - e, thickness=0.25)]
            + (
                [
                    wall(e, 5.6, 6.5 - 0.125, 5.6, door(2.4)),
                    wall(6.5 + 0.125, 5.6, RW - e, 5.6, door(2.4)),
                ]
                if level == 0
                else [
                    wall(e, 5.0, 6.5 - 0.125, 5.0, door(2.4)),
                    wall(6.5 + 0.125, 5.0, RW - e, 5.0, door(2.4)),
                ]
            ),
            "spaces": (
                [
                    room("House A — kitchen & dining", e, e, 6.375, 5.6 - i),
                    room("House A — living", e, 5.6 + i, 6.375, RD - e),
                    room("House B — kitchen & dining", 6.625, e, RW - e, 5.6 - i),
                    room("House B — living", 6.625, 5.6 + i, RW - e, RD - e),
                ]
                if level == 0
                else [
                    room("House A — bedroom 1", e, e, 6.375, 5.0 - i),
                    room("House A — bedroom 2", e, 5.0 + i, 6.375, RD - e),
                    room("House B — bedroom 1", 6.625, e, RW - e, 5.0 - i),
                    room("House B — bedroom 2", 6.625, 5.0 + i, RW - e, RD - e),
                ]
            ),
        }
        for level, name in enumerate(["Ground Floor", "First Floor"])
    ],
    "roof": {"outline": rect(0, 0, RW, RD), "thickness": 0.25},
}

# --- 3. Small office ------------------------------------------------------------------------------------------
OW, OD, OH = 20.0, 12.0, 3.5
CX0, CX1, CY0, CY1 = 8.0, 12.0, 4.0, 8.0  # stair and lift core


def office_floor(level: int) -> dict:
    name = ["Ground Floor", "First Floor", "Second Floor"][level]
    front = windows(0.9, 7, 2.7, width=1.8, height=2.0, sill=0.8)
    if level == 0:
        front[3] = door(8.5, 2.0, 2.4)  # glazed entrance instead of the middle window
    return {
        "name": name,
        "elevation": level * OH,
        "height": OH,
        "slab": {"outline": rect(0, 0, OW, OD)},
        "walls": shell(
            OW,
            OD,
            {
                "front": front,
                "back": windows(0.9, 7, 2.7, width=1.8, height=2.0, sill=0.8),
                "right": windows(1.4, 4, 2.4, width=1.4, height=2.0, sill=0.8),
                "left": windows(1.4, 4, 2.4, width=1.4, height=2.0, sill=0.8),
            },
        )
        + [
            wall(CX0, CY0, CX1, CY0, door(1.5, 1.0), thickness=0.25),
            wall(CX1, CY0, CX1, CY1, thickness=0.25),
            wall(CX1, CY1, CX0, CY1, thickness=0.25),
            wall(CX0, CY1, CX0, CY0, thickness=0.25),
        ],
        "spaces": [
            room("Open office west", e, e, CX0 - 0.125, OD - e),
            room("Open office east", CX1 + 0.125, e, OW - e, OD - e),
            room("Core — stairs & lift", CX0 + 0.125, CY0 + 0.125, CX1 - 0.125, CY1 - 0.125),
        ],
    }


small_office = {
    "project": "Small office",
    "storeys": [office_floor(n) for n in range(3)],
    "roof": {"outline": rect(0, 0, OW, OD), "thickness": 0.3},
}

# --- 4. Warehouse with office ---------------------------------------------------------------------------------
HW, HD, HH = 30.0, 20.0, 7.0
warehouse = {
    "project": "Warehouse with office",
    "storeys": [
        {
            "name": "Ground Floor",
            "elevation": 0.0,
            "height": HH,
            "slab": {"outline": rect(0, 0, HW, HD), "thickness": 0.25},
            "walls": shell(
                HW,
                HD,
                {
                    "front": [
                        window(1.5, 1.6),
                        window(4.5, 1.6),
                        door(7.0, 1.0, 2.2),
                        door(13.0, 4.0, 4.5),
                        door(20.0, 4.0, 4.5),
                    ],
                    "back": windows(2.0, 6, 4.5, width=3.0, height=1.2, sill=4.8),
                    "right": [door(15.5, 1.0, 2.2)]
                    + windows(2.0, 3, 4.5, width=3.0, height=1.2, sill=4.8),
                    # The left wall runs back → front, so offsets count from the back corner.
                    "left": windows(2.0, 2, 4.5, width=3.0, height=1.2, sill=4.8)
                    + [window(15.5, 1.6)],
                },
            )
            + [
                wall(9.0, e, 9.0, 7.0, door(4.8)),
                wall(9.0, 7.0, e, 7.0, door(1.4), window(4.0, 2.0, 1.2, 1.0)),
                wall(4.5, e, 4.5, 7.0 - i, door(4.6, 0.8)),
            ],
            "spaces": [
                room("Office", e, e, 4.5 - i, 7.0 - i),
                room("Staff room", 4.5 + i, e, 9.0 - i, 7.0 - i),
                {  # L-shaped: wraps around the office block
                    "name": "Storage hall",
                    "outline": [
                        [9.0 + i, e],
                        [HW - e, e],
                        [HW - e, HD - e],
                        [e, HD - e],
                        [e, 7.0 + i],
                        [9.0 + i, 7.0 + i],
                    ],
                },
            ],
        }
    ],
    "roof": {"outline": rect(0, 0, HW, HD), "thickness": 0.3},
}


SAMPLES: list[dict[str, Any]] = [
    {
        "slug": "family-house",
        "title": "Family house",
        "buildingType": "house",
        "location": "Suburban plot",
        "input": "Hand sketch with dimensions",
        "description": "Two-storey family home: open living and dining, kitchen and bathroom on the ground floor; "
        "two bedrooms, a study and a bathroom upstairs.",
        "spec": family_house,
    },
    {
        "slug": "row-houses",
        "title": "Row houses",
        "buildingType": "apartment_building",
        "location": "Infill site",
        "input": "PDF plan set (2 sheets)",
        "description": "Two mirrored terraced homes sharing a party wall. Kitchen and living on the ground floor, "
        "two bedrooms each upstairs.",
        "spec": row_houses,
    },
    {
        "slug": "small-office",
        "title": "Small office",
        "buildingType": "office",
        "location": "Business park",
        "input": "DWG floor plans",
        "description": "Three-storey office with a central stair and lift core, open-plan floors and a regular "
        "window rhythm on every facade.",
        "spec": small_office,
    },
    {
        "slug": "warehouse",
        "title": "Warehouse with office",
        "buildingType": "industrial",
        "location": "Logistics zone",
        "input": "Text description + photo",
        "description": "7 m high storage hall with two loading doors, high-level windows and a small office and "
        "staff room in the front corner.",
        "spec": warehouse,
    },
]
