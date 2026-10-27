import { BUILDING_TYPES, BUILDING_TYPE_LABELS, type PublicProject } from "@ifcwise/shared";
import { Field, inputClass } from "@/components/ui";

// Fields shared by the create form and the manage page. Plain inputs read via FormData.
export function ProjectFields({ defaults }: { defaults?: Partial<PublicProject> }) {
  return (
    <>
      <div className="sm:col-span-2">
        <Field label="Title">
          <input name="title" required minLength={3} maxLength={120} defaultValue={defaults?.title} placeholder="Two-storey family house" className={inputClass} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Description" hint="(what to model, known dimensions, anything unclear in the drawings)">
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            defaultValue={defaults?.description}
            placeholder="Ground floor plan and one elevation attached. Wall height 2.8 m, gable roof at 35°…"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Building type" hint="(optional)">
        <select name="buildingType" defaultValue={defaults?.buildingType ?? ""} className={inputClass}>
          <option value="">—</option>
          {BUILDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {BUILDING_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Storeys">
          <input name="storeys" type="number" min={1} max={100} defaultValue={defaults?.storeys} className={inputClass} />
        </Field>
        <Field label="Area">
          <input name="approxAreaM2" type="number" min={1} step="any" defaultValue={defaults?.approxAreaM2} placeholder="m²" className={inputClass} />
        </Field>
        <Field label="Units">
          <select name="units" defaultValue={defaults?.units ?? "m"} className={inputClass}>
            <option value="m">m</option>
            <option value="ft">ft</option>
          </select>
        </Field>
      </div>
    </>
  );
}

export function readDetails(data: FormData) {
  return {
    title: data.get("title"),
    description: data.get("description"),
    buildingType: data.get("buildingType"),
    storeys: data.get("storeys"),
    approxAreaM2: data.get("approxAreaM2"),
    units: data.get("units"),
  };
}
