# ifc-tools

Python CLI used by `apps/app` (and by hand) to prepare job folders and validate IFC output.
See PLAN.md §8.

```bash
uv run --project tools/ifc-tools ifc-tools --help
uv run --project tools/ifc-tools ifc-tools prepare C:\IFCWiseData\jobs\<job-id>
uv run --project tools/ifc-tools ifc-tools validate C:\IFCWiseData\jobs\<job-id>
```

Python 3.12 is pinned because `ifcopenshell` wheels lag behind new Python releases.
`uv` downloads it automatically.
