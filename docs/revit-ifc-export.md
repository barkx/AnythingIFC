# Revit IFC export settings — "IFCWise IFC4 RV"

Settings for Route A (Revit 2025/2026, built-in IFC exporter / IFC for Revit). Create the setup once,
save it, and use it for every job. Labels can differ slightly between exporter versions — match by meaning.

*File ▸ Export ▸ IFC ▸ Modify setup…* → duplicate the default setup → name it **IFCWise IFC4 RV**.

## General

| Setting | Value | Why |
|---|---|---|
| IFC version | **IFC4 Reference View** | Clean geometry for viewing and coordination; what `validate` expects (IFC4) |
| File type | IFC | Plain `.ifc` text file |
| Phase to export | the project's main phase (default) | |
| Space boundaries | None | Not needed at LOD 100–200 |
| Split walls, columns, ducts by level | **On** | Each element ends up in exactly one storey |

## Additional content

| Setting | Value |
|---|---|
| Export 2D plan view elements | Off |
| Export linked files | **Off** — the CAD/PDF underlays must not end up in the IFC |
| Export only elements visible in view | Off (export the whole model) |
| Export rooms, areas and spaces in 3D views | **On** — rooms become `IfcSpace` |

## Property sets

| Setting | Value |
|---|---|
| Export Revit property sets | Off |
| Export IFC common property sets | **On** |
| Export base quantities | **On** — gives areas/volumes, and room floor areas for the summary |
| Export schedules as property sets | Off |

## Level of detail

Detail level for element geometry: **Low** (enough for LOD 100–200, keeps files small).

## Advanced

| Setting | Value |
|---|---|
| Export parts as building elements | Off |
| Allow use of mixed "Solid Model" representation | Off |
| Use active view when creating geometry | Off |
| Use family and type name for reference | **On** (readable types in the IFC) |
| Use 2D room boundaries for room volume | On |
| Include IfcSite elevation in the site local placement origin | Off |
| Store the IFC GUID in an element parameter after export | **On** (stable GUIDs on re-export) |

## Geographic reference / coordinates

Coordinate base: **Project base point** (or Internal origin). We don't georeference PoC models;
inputs are aligned to the origin when linked.

## Check after export

```bash
npm run tools -- validate <id>
```

Typical fixes when validate fails:

| Error | Fix in Revit |
|---|---|
| Length unit scale is 0.001 m | The IFC was written in millimetres: set *Manage ▸ Project Units ▸ Length* to metres (m) and export again |
| Elements not contained in a storey | Turn on *Split walls … by level*; make sure every element is hosted on a level |
| No IfcSpace | Place rooms and turn on *Export rooms … in 3D views* |
| No IfcWall | Walls filtered out — check *Export only elements visible in view* is off and the IFC class mapping |

Save the setup to a file (*Save selected setup*) as
`C:\IFCWiseData\revit\IFCWise-IFC4-RV.json` so it can be re-imported after reinstalling Revit.
