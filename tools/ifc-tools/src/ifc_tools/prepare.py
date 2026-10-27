"""Turn a job folder's inputs into agent-friendly data and render PROMPT.md (PLAN.md §8)."""

import json
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pymupdf
from ezdxf import bbox, recover
from jinja2 import Environment, FileSystemLoader, StrictUndefined

JOB_DIRS = ("input", "prepared", "output", "revit", "bonsai")
DXF_UNITS = {0: "unitless", 1: "in", 2: "ft", 4: "mm", 5: "cm", 6: "m"}
MAX_PDF_PAGES = 20
MAX_TEXT_CHARS = 5000


@dataclass
class PrepareReport:
    geometry: list[str] = field(default_factory=list)
    pages: list[str] = field(default_factory=list)
    texts: dict[str, str] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)


def _r(value: float) -> float:
    return round(float(value), 4)


def extract_dxf(path: Path) -> dict[str, Any]:
    """Geometry per layer: lines, polylines, arcs/circles, texts, block inserts, dimensions."""
    doc, auditor = recover.readfile(path)
    msp = doc.modelspace()
    layers: dict[str, dict[str, list]] = {}

    def layer(name: str) -> dict[str, list]:
        return layers.setdefault(
            name,
            {
                "lines": [],
                "polylines": [],
                "arcs": [],
                "texts": [],
                "inserts": [],
                "dimensions": [],
            },
        )

    for e in msp:
        kind, target = e.dxftype(), layer(e.dxf.get("layer", "0"))
        if kind == "LINE":
            s, t = e.dxf.start, e.dxf.end
            target["lines"].append([_r(s.x), _r(s.y), _r(t.x), _r(t.y)])
        elif kind == "LWPOLYLINE":
            target["polylines"].append(
                {
                    "closed": bool(e.closed),
                    "points": [[_r(x), _r(y)] for x, y in e.get_points("xy")],
                }
            )
        elif kind == "POLYLINE" and not e.is_3d_polyline:
            pts = [[_r(v.dxf.location.x), _r(v.dxf.location.y)] for v in e.vertices]
            target["polylines"].append({"closed": bool(e.is_closed), "points": pts})
        elif kind in ("CIRCLE", "ARC"):
            c = e.dxf.center
            arc = {"center": [_r(c.x), _r(c.y)], "radius": _r(e.dxf.radius)}
            if kind == "ARC":
                arc |= {"start_angle": _r(e.dxf.start_angle), "end_angle": _r(e.dxf.end_angle)}
            target["arcs"].append(arc)
        elif kind in ("TEXT", "MTEXT"):
            text, height = (
                (e.dxf.text, e.dxf.get("height", 0))
                if kind == "TEXT"
                else (e.plain_text(), e.dxf.get("char_height", 0))
            )
            p = e.dxf.insert
            target["texts"].append(
                {"text": text.strip(), "at": [_r(p.x), _r(p.y)], "height": _r(height or 0)}
            )
        elif kind == "INSERT":
            p = e.dxf.insert
            target["inserts"].append(
                {
                    "block": e.dxf.name,
                    "at": [_r(p.x), _r(p.y)],
                    "rotation": _r(e.dxf.get("rotation", 0)),
                    "scale": [_r(e.dxf.get("xscale", 1)), _r(e.dxf.get("yscale", 1))],
                }
            )
        elif kind == "DIMENSION":
            try:
                measurement = _r(e.get_measurement())
            except Exception:  # noqa: BLE001 — some dimension types can't be measured without a render
                measurement = None
            target["dimensions"].append({"text": e.dxf.get("text", ""), "measurement": measurement})

    extents = bbox.extents(msp)
    return {
        "source": path.name,
        "units": DXF_UNITS.get(int(doc.header.get("$INSUNITS", 0)), "other"),
        "extents": [
            [_r(extents.extmin.x), _r(extents.extmin.y)],
            [_r(extents.extmax.x), _r(extents.extmax.y)],
        ]
        if extents.has_data
        else None,
        "audit_errors": len(auditor.errors),
        "layers": {
            name: {k: v for k, v in data.items() if v} for name, data in sorted(layers.items())
        },
    }


def convert_dwg(path: Path, out_dir: Path) -> Path | None:
    """DWG → DXF with ODA File Converter if ODA_CONVERTER points at ODAFileConverter.exe."""
    exe = os.environ.get("ODA_CONVERTER")
    if not exe or not Path(exe).exists():
        return None
    staging = out_dir / "_dwg"
    shutil.rmtree(staging, ignore_errors=True)
    (staging / "in").mkdir(parents=True)
    shutil.copy2(path, staging / "in" / path.name)
    subprocess.run(
        [exe, str(staging / "in"), str(staging / "out"), "ACAD2018", "DXF", "0", "1", "*.DWG"],
        check=True,
        timeout=300,
    )
    produced = next((staging / "out").glob("*.dxf"), None)
    if not produced:
        return None
    target = out_dir / f"{path.stem}.from-dwg.dxf"
    shutil.move(produced, target)
    shutil.rmtree(staging, ignore_errors=True)
    return target


def render_pdf(path: Path, pages_dir: Path) -> list[Path]:
    pages_dir.mkdir(parents=True, exist_ok=True)
    out: list[Path] = []
    with pymupdf.open(path) as doc:
        for index, page in enumerate(doc):
            if index >= MAX_PDF_PAGES:
                break
            target = pages_dir / f"{path.stem}-p{index + 1}.png"
            page.get_pixmap(dpi=150).save(target)
            out.append(target)
    return out


def render_prompt(job_dir: Path, job: dict[str, Any], report: PrepareReport) -> Path:
    env = Environment(
        loader=FileSystemLoader(Path(__file__).parent / "templates"),
        undefined=StrictUndefined,
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )
    text = env.get_template("PROMPT.md.j2").render(job=job, report=report)
    target = job_dir / "PROMPT.md"
    target.write_text(text, encoding="utf-8")
    return target


def prepare(job_dir: Path) -> PrepareReport:
    for name in JOB_DIRS:
        (job_dir / name).mkdir(exist_ok=True)
    job_file = job_dir / "job.json"
    if not job_file.exists():
        raise FileNotFoundError(f"{job_file} is missing — run `ifc-tools pull <id>` first.")
    job = json.loads(job_file.read_text(encoding="utf-8"))
    prepared, report = job_dir / "prepared", PrepareReport()

    for path in sorted((job_dir / "input").iterdir()):
        suffix = path.suffix.lower()
        try:
            if suffix == ".dwg":
                dxf = convert_dwg(path, prepared)
                if dxf is None:
                    report.notes.append(
                        f"{path.name}: DWG not converted (set ODA_CONVERTER) — use it as a Revit CAD link."
                    )
                    continue
                path, suffix = dxf, ".dxf"
            if suffix == ".dxf":
                target = prepared / f"{path.stem}.geometry.json"
                target.write_text(json.dumps(extract_dxf(path), indent=1), encoding="utf-8")
                report.geometry.append(target.relative_to(job_dir).as_posix())
            elif suffix == ".pdf":
                report.pages += [
                    p.relative_to(job_dir).as_posix() for p in render_pdf(path, prepared / "pages")
                ]
            elif suffix in (".txt", ".md"):
                report.texts[path.name] = path.read_text(encoding="utf-8", errors="replace")[
                    :MAX_TEXT_CHARS
                ]
        except Exception as error:  # noqa: BLE001 — one bad file shouldn't stop the others
            report.notes.append(f"{path.name}: could not be prepared ({error}).")

    render_prompt(job_dir, job, report)
    return report
