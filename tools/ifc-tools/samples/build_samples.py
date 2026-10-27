"""Build the reference projects into apps/app/public/samples/<slug>/ and packages/shared/src/samples.ts.

Run from the repo root:  npm run samples
"""

import json
import math
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from ifc_tools.builder import build
from ifc_tools.validate import validate_file

sys.path.insert(0, str(Path(__file__).parent))
from specs import SAMPLES

ROOT = Path(__file__).resolve().parents[3]
PUBLIC = ROOT / "apps" / "app" / "public" / "samples"
SHARED = ROOT / "packages" / "shared" / "src" / "samples.ts"

INK, ACCENT, MUTED, GRID = "#1c1917", "#0f766e", "#78716c", "#e7e5e4"


def _fmt(v: float) -> str:
    return f"{v:.3f}".rstrip("0").rstrip(".")


def _centroid(pts: list[list[float]]) -> tuple[float, float]:
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        c = x1 * y2 - x2 * y1
        a, cx, cy = a + c, cx + (x1 + x2) * c, cy + (y1 + y2) * c
    return (cx / (3 * a), cy / (3 * a)) if a else (pts[0][0], pts[0][1])


def plan_svg(storey: dict, title: str) -> str:
    """Architect-style ground-floor plan: walls with openings, door swings, windows, room labels, dimensions."""
    xs = [p[0] for p in storey["slab"]["outline"]]
    ys = [p[1] for p in storey["slab"]["outline"]]
    width, depth = max(xs) - min(xs), max(ys) - min(ys)
    m = 2.2  # margin in metres
    vw, vh = width + 2 * m, depth + 2 * m
    fy = lambda y: depth + m - y
    fx = lambda x: x + m
    font = max(0.32, min(width, depth) / 26)
    out: list[str] = [
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {_fmt(vw)} {_fmt(vh)}" '
            'font-family="ui-sans-serif, system-ui, sans-serif">'
        ),
        f"<title>{escape(title)} — {escape(storey['name'])} plan</title>",
        (
            '<defs><pattern id="g" width="1" height="1" patternUnits="userSpaceOnUse">'
            f'<path d="M1 0H0V1" fill="none" stroke="{GRID}" stroke-width="0.02"/></pattern></defs>'
        ),
        f'<rect width="{_fmt(vw)}" height="{_fmt(vh)}" fill="#fff"/>',
        f'<rect width="{_fmt(vw)}" height="{_fmt(vh)}" fill="url(#g)"/>',
    ]

    # Rooms first (under the walls): soft fill + name and area.
    for space in storey.get("spaces", []):
        pts = space["outline"]
        poly = " ".join(f"{_fmt(fx(x))},{_fmt(fy(y))}" for x, y in pts)
        area = abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))) / 2
        cx, cy = _centroid(pts)
        name = escape(space["name"].split(" — ")[-1])
        out.append(f'<polygon points="{poly}" fill="{ACCENT}" fill-opacity="0.05"/>')
        out.append(
            f'<text x="{_fmt(fx(cx))}" y="{_fmt(fy(cy))}" text-anchor="middle" font-size="{_fmt(font)}" '
            f'fill="{INK}" font-weight="600">{name}</text>'
        )
        out.append(
            f'<text x="{_fmt(fx(cx))}" y="{_fmt(fy(cy) + font * 1.3)}" text-anchor="middle" '
            f'font-size="{_fmt(font * 0.85)}" fill="{MUTED}">{area:.1f} m²</text>'
        )

    # Walls: solid segments between openings; ends extended by half a thickness so corners close.
    for w in storey["walls"]:
        (x0, y0), (x1, y1) = w["start"], w["end"]
        t = w.get("thickness", 0.3)
        length = math.hypot(x1 - x0, y1 - y0)
        ux, uy = (x1 - x0) / length, (y1 - y0) / length
        nx, ny = -uy, ux
        cuts = sorted(
            (o["offset"], o["offset"] + o.get("width", 0.9)) for o in w.get("openings", [])
        )
        bounds, pos = [], 0.0
        for a, b in cuts:
            bounds.append((pos, a))
            pos = b
        bounds.append((pos, length))
        for a, b in bounds:
            a2 = a - t / 2 if a == 0 else a
            b2 = b + t / 2 if b == length else b
            if b2 - a2 <= 0.001:
                continue
            corners = [
                (x0 + ux * a2 + nx * t / 2, y0 + uy * a2 + ny * t / 2),
                (x0 + ux * b2 + nx * t / 2, y0 + uy * b2 + ny * t / 2),
                (x0 + ux * b2 - nx * t / 2, y0 + uy * b2 - ny * t / 2),
                (x0 + ux * a2 - nx * t / 2, y0 + uy * a2 - ny * t / 2),
            ]
            out.append(
                f'<polygon points="{" ".join(f"{_fmt(fx(x))},{_fmt(fy(y))}" for x, y in corners)}" fill="{INK}"/>'
            )

        for o in w.get("openings", []):
            a, ow = o["offset"], o.get("width", 0.9)

            def p(s: float, n: float = 0.0, g=(x0, y0, ux, uy, nx, ny)) -> tuple[float, float]:
                """Point at distance s along the wall and n to its left."""
                return g[0] + g[2] * s + g[4] * n, g[1] + g[3] * s + g[5] * n

            if o["type"] == "window":
                for n in (-t / 2, t / 2, 0.0):
                    (ax, ay), (bx, by) = p(a, n), p(a + ow, n)
                    sw = 0.03 if n else 0.05
                    out.append(
                        f'<line x1="{_fmt(fx(ax))}" y1="{_fmt(fy(ay))}" x2="{_fmt(fx(bx))}" y2="{_fmt(fy(by))}" '
                        f'stroke="{ACCENT if n == 0 else INK}" stroke-width="{sw}"/>'
                    )
            elif ow >= 2.5:
                # Wide doors are sectional/overhead doors: dashed line across the opening, no swing.
                (ax, ay), (bx, by) = p(a, t / 2 + 0.4), p(a + ow, t / 2 + 0.4)
                out.append(
                    f'<line x1="{_fmt(fx(ax))}" y1="{_fmt(fy(ay))}" x2="{_fmt(fx(bx))}" y2="{_fmt(fy(by))}" '
                    f'stroke="{MUTED}" stroke-width="0.04" stroke-dasharray="0.25 0.15"/>'
                )
            else:
                # Door leaf swings inwards (to the wall's left side) from the hinge at the opening start.
                hx, hy = p(a)
                lx, ly = hx + nx * ow, hy + ny * ow
                ex, ey = p(a + ow)
                out.append(
                    f'<line x1="{_fmt(fx(hx))}" y1="{_fmt(fy(hy))}" x2="{_fmt(fx(lx))}" y2="{_fmt(fy(ly))}" '
                    f'stroke="{INK}" stroke-width="0.04"/>'
                )
                sweep = 1 if (ux * ny - uy * nx) > 0 else 0
                out.append(
                    f'<path d="M{_fmt(fx(lx))} {_fmt(fy(ly))} A{_fmt(ow)} {_fmt(ow)} 0 0 {sweep} {_fmt(fx(ex))} {_fmt(fy(ey))}" '
                    f'fill="none" stroke="{MUTED}" stroke-width="0.025" stroke-dasharray="0.12 0.08"/>'
                )

    # Overall dimensions below and left of the plan.
    dy = fy(0) + 1.1
    out.append(
        f'<g stroke="{MUTED}" stroke-width="0.03" fill="{MUTED}" font-size="{_fmt(font * 0.9)}">'
    )
    out.append(f'<line x1="{_fmt(fx(0))}" y1="{_fmt(dy)}" x2="{_fmt(fx(width))}" y2="{_fmt(dy)}"/>')
    for x in (0, width):
        out.append(
            f'<line x1="{_fmt(fx(x))}" y1="{_fmt(dy - 0.25)}" x2="{_fmt(fx(x))}" y2="{_fmt(dy + 0.25)}"/>'
        )
    out.append(
        f'<text x="{_fmt(fx(width / 2))}" y="{_fmt(dy - 0.2)}" text-anchor="middle" stroke="none">{width:.2f}</text>'
    )
    dx = fx(0) - 1.1
    out.append(f'<line x1="{_fmt(dx)}" y1="{_fmt(fy(0))}" x2="{_fmt(dx)}" y2="{_fmt(fy(depth))}"/>')
    for y in (0, depth):
        out.append(
            f'<line x1="{_fmt(dx - 0.25)}" y1="{_fmt(fy(y))}" x2="{_fmt(dx + 0.25)}" y2="{_fmt(fy(y))}"/>'
        )
    out.append(
        f'<text x="{_fmt(dx - 0.25)}" y="{_fmt(fy(depth / 2))}" text-anchor="middle" stroke="none" '
        f'transform="rotate(-90 {_fmt(dx - 0.25)} {_fmt(fy(depth / 2))})">{depth:.2f}</text>'
    )
    out.append("</g>")
    out.append(
        f'<text x="{_fmt(m)}" y="{_fmt(m * 0.55)}" font-size="{_fmt(font)}" fill="{MUTED}" '
        f'letter-spacing="0.04">{storey["name"].upper()} · 1:100</text>'
    )
    out.append("</svg>")
    return "\n".join(out) + "\n"


def assumptions_md(sample: dict) -> str:
    spec = sample["spec"]
    heights = sorted(
        {
            s.get("height", spec.get("defaults", {}).get("storeyHeight", 3.0))
            for s in spec["storeys"]
        }
    )
    return (
        f"# Assumptions — {sample['title']}\n\n"
        "- Reference project generated by IFCWise to show the output format; not a real building.\n"
        f"- Source shown as: {sample['input']}.\n"
        f"- Storey height {', '.join(f'{h:.1f} m' for h in heights)} including a 0.2 m floor slab.\n"
        "- Exterior walls 300 mm, interior walls 120 mm (core and party walls 250 mm).\n"
        "- Doors 900 × 2100 mm and windows 1200 × 1200 mm unless drawn otherwise; sills 900 mm.\n"
        "- Flat roof; roof build-up, structure and MEP are not modelled (LOD 100–200).\n"
    )


def main() -> None:
    meta = []
    for sample in SAMPLES:
        out = PUBLIC / sample["slug"]
        out.mkdir(parents=True, exist_ok=True)
        ifc_path = out / "model.ifc"
        build(sample["spec"]).write(str(ifc_path))
        result = validate_file(ifc_path)
        if not result.ok:
            raise SystemExit(f"{sample['slug']}: {result.errors}")
        (out / "summary.json").write_text(
            json.dumps(result.summary, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        (out / "assumptions.md").write_text(assumptions_md(sample), encoding="utf-8")
        (out / "model-spec.json").write_text(json.dumps(sample["spec"], indent=1), encoding="utf-8")
        (out / "plan.svg").write_text(
            plan_svg(sample["spec"]["storeys"][0], sample["title"]), encoding="utf-8"
        )

        counts = result.summary["counts"]
        meta.append(
            {
                "slug": sample["slug"],
                "title": sample["title"],
                "description": sample["description"],
                "buildingType": sample["buildingType"],
                "location": sample["location"],
                "input": sample["input"],
                "storeys": sum(1 for s in result.summary["storeys"] if s["name"] != "Roof"),
                "floorAreaM2": result.summary.get("floorAreaM2"),
                "elements": sum(v for k, v in counts.items() if k != "IfcSpace"),
                "rooms": counts.get("IfcSpace", 0),
                "ifcBytes": ifc_path.stat().st_size,
            }
        )
        print(
            f"{sample['slug']:<14} {ifc_path.stat().st_size // 1024:>4} KB  {counts}  warnings={result.warnings}"
        )

    SHARED.write_text(
        "// Generated by tools/ifc-tools/samples/build_samples.py (npm run samples). Do not edit by hand.\n"
        'import type { BuildingType } from "./index";\n\n'
        "export type SampleProject = {\n"
        "  slug: string;\n  title: string;\n  description: string;\n  buildingType: BuildingType;\n"
        "  location: string;\n  input: string;\n  storeys: number;\n  floorAreaM2?: number;\n"
        "  elements: number;\n  rooms: number;\n  ifcBytes: number;\n};\n\n"
        f"export const SAMPLE_PROJECTS: SampleProject[] = {json.dumps(meta, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )
    print(f"wrote {SHARED.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
