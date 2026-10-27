# SOP — converting a project to IFC (manual PoC)

How the operator turns a submitted project into a delivered IFC model. Target: under 2 hours for a single house.
Keep a human in the loop at every step (PLAN.md §10): the agent proposes, you check and deliver.

## 0. One-time setup

- `tools/ifc-tools/.env` — copy from `.env.example`; `IFCWISE_ADMIN_TOKEN` = the app's `ADMIN_API_TOKEN`,
  `IFCWISE_APP_URL=https://app.ifcwise.com` (or `http://localhost:3001` while testing).
- Optional: install [ODA File Converter](https://www.opendesign.com/guestfiles/oda_file_converter) and set
  `ODA_CONVERTER` to `ODAFileConverter.exe` so DWG files are converted to DXF.
- Route A: Revit 2025/2026 with the Revit MCP working, the IFCWise template (§A1) and the saved IFC export
  setup (`docs/revit-ifc-export.md`).
- Route B: nothing else — `ifc-tools build` writes the IFC. Blender + Bonsai is optional for inspecting/fixing.

## 1. Review and pick up

1. Admin page → **Awaiting review**. Open the project; check the inputs are usable and nothing is
   inappropriate or obviously confidential. Reject or ask a question if needed.
2. **Approve & publish** when it's fine to show publicly (you can also publish after delivery).
3. Set status **In progress** so the creator sees it's being worked on.
4. On your PC:
   ```bash
   npm run tools -- pull <id>
   ```
   This creates `C:\IFCWiseData\jobs\<id>\` with `input\`, `prepared\` and `PROMPT.md`.
5. Read `PROMPT.md` and look at the inputs. If key information is missing (storey count, heights, scale),
   ask the creator from the admin page (**Ask question** → status *needs info*) instead of guessing.

## 2. Choose a route

| Inputs | Route |
|---|---|
| Clean DWG/DXF plans | A (Revit) — CAD link + MCP is fastest and most accurate |
| PDF plans / scans | A — PDF underlay in Revit; or B if the building is simple |
| Sketch, photo or text only | B — describe it as a model spec; simple, quick, flat roofs |
| Pitched or complex roofs | A |

Record which route you used and how long it took in `docs/test-runs.md`.

## Route A — Codex + Revit MCP

**A1. Template (once).** `IFCWise_Template.rte` (kept outside the public repo): metric units; levels
"Ground Floor"/"First Floor"; wall types *Wall 300 mm* and *Wall 120 mm*, floor *Floor 200 mm*,
roof *Roof 200 mm*; door 900×2100 and window 1200×1200 families; IFC export class mappings checked
(walls → IfcWall, floors → IfcSlab, roofs → IfcRoof/IfcSlab, rooms → IfcSpace).

**A2. Set up the model**
1. New project from the template; save as `C:\IFCWiseData\jobs\<id>\revit\model.rvt`.
2. Bring in the inputs on the right level, scaled and aligned to the origin:
   DWG/DXF → *Insert ▸ Link CAD* (current view only, correct units); PDF → *Insert ▸ Link PDF* (scale with a
   known dimension); images → *Insert ▸ Image*.
3. Adjust levels to the heights you know.

**A3. Model with the agent**
1. Open a terminal in the job folder and start Codex (or Claude Code) there.
2. Prompt: *"Read PROMPT.md. Use Route A. Model the building in the open Revit project with the Revit MCP.
   Work storey by storey and stop after each storey so I can check."*
3. After each storey check in Revit: wall joins, heights, door/window positions, rooms closed.
   Fix by hand where that's quicker than explaining.

**A4. Export**
1. Rooms: make sure every room is placed and bounded (*Room* tags show areas).
2. *File ▸ Export ▸ IFC* with the saved setup **IFCWise IFC4 RV** (`docs/revit-ifc-export.md`) →
   `output\model.ifc`.
3. Continue with step 3 below.

## Route B — model spec (+ optional Bonsai)

1. Start Codex (or Claude Code) in the job folder.
2. Prompt: *"Read PROMPT.md. Use Route B. Write output/model-spec.json from the inputs and prepared data,
   then run the build command. Fix anything validate reports. Write output/assumptions.md."*
3. The agent runs:
   ```bash
   npm run tools -- build <id>
   ```
   which writes `output\model.ifc` and validates it.
4. Check the result: open it in the viewer (BIMcollab Zoom, or Blender + Bonsai). Compare against the inputs:
   outline, storey heights, openings on the right walls, room names.
5. Small fixes: edit `model-spec.json` and build again. For things the spec can't express (pitched roofs,
   curved walls), open the IFC in Bonsai, edit, and save back to `output\model.ifc`.

### Model spec reference

All lengths in metres. Omitted values use `defaults` (wall 0.3, storey height 3.0, slab 0.2).

| Key | Meaning |
|---|---|
| `storeys[].name`, `elevation`, `height` | Storey; elevation defaults to index × storey height |
| `storeys[].slab.outline` | Floor slab polygon `[[x, y], …]`; walls start on top of it |
| `storeys[].walls[]` | `start`, `end` = wall centre line; optional `thickness`, `height`, `name` |
| `walls[].openings[]` | `type` door/window, `offset` along the wall from `start`, `width`, `height`, `sill` |
| `storeys[].spaces[]` | `name`, `outline` (inside faces); floor area is computed |
| `roof` | Flat roof slab: `outline`, optional `elevation` (default top of last storey), `thickness` |

Defaults for openings: door 0.9 × 2.1 m, window 1.2 × 1.2 m with 0.9 m sill.

## 3. Check

```bash
npm run tools -- validate <id>
```

Must exit without errors. Then check by eye:

- [ ] Number of storeys and their names match the inputs
- [ ] Outline and main dimensions match (spot-check 2–3 dimensions)
- [ ] Openings sit on the right walls; doors at floor level
- [ ] Rooms exist and are named; areas plausible
- [ ] Nothing floats or is duplicated (open in BIMcollab Zoom or Solibri Anywhere)
- [ ] `output\assumptions.md` lists every guess (heights, thicknesses, roof, unclear areas) in plain language

## 4. Deliver

1. Optional: save a screenshot as `output\preview.png` (used as the gallery thumbnail).
2. Admin page → project → **Model output** → drop `model.ifc`, `summary.json`, `assumptions.md`
   (and `preview.png`) → **Upload & complete**.
3. Open the public project page: the viewer loads, summary and assumptions show.
4. Email the creator from the admin page (link in the *Creator* card) if Resend isn't set up yet.

## 5. Log it

Add a row to `docs/test-runs.md`: date, project id, inputs, route, minutes, problems, what to improve.
