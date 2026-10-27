import type { ModelSummary } from "@ifcwise/shared";
import { AlertTriangle, Boxes, DoorOpen, Layers, Ruler } from "lucide-react";

const LABELS: Record<string, string> = {
  IfcWall: "Walls",
  IfcSlab: "Slabs & roof",
  IfcDoor: "Doors",
  IfcWindow: "Windows",
  IfcSpace: "Rooms",
  IfcRoof: "Roof",
  IfcColumn: "Columns",
  IfcBeam: "Beams",
  IfcStair: "Stairs",
};

export function StatTiles({ summary }: { summary: ModelSummary }) {
  const storeys = summary.storeys.filter((s) => s.name !== "Roof").length || summary.storeys.length;
  const elements = Object.entries(summary.counts).reduce((n, [k, v]) => (k === "IfcSpace" ? n : n + v), 0);
  const tiles = [
    { icon: Layers, label: "Storeys", value: storeys },
    { icon: Boxes, label: "Elements", value: elements },
    { icon: DoorOpen, label: "Rooms", value: summary.counts.IfcSpace ?? 0 },
    { icon: Ruler, label: "Floor area", value: summary.floorAreaM2 ? `${Math.round(summary.floorAreaM2)} m²` : "—" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-background p-4">
          <dt className="flex items-center gap-2 text-xs font-medium text-muted">
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SummaryTable({ summary }: { summary: ModelSummary }) {
  const classes = Object.entries(summary.counts).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Element</th>
              {summary.storeys.map((s) => (
                <th key={s.name} className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                  {s.name}
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classes.map(([ifcClass, total]) => (
              <tr key={ifcClass}>
                <td className="px-4 py-2.5">
                  {LABELS[ifcClass] ?? ifcClass}
                  <span className="ml-2 font-mono text-[11px] text-subtle">{ifcClass}</span>
                </td>
                {summary.storeys.map((s) => (
                  <td key={s.name} className="px-4 py-2.5 text-right font-mono text-xs text-muted">
                    {s.counts[ifcClass] ?? "–"}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
          {summary.warnings.map((w) => (
            <li key={w} className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// assumptions.md is short markdown: a heading and bullet points. Render those two forms, the rest as text.
export function Assumptions({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-*] /.test(l)).map((l) => l.slice(2));
  const text = lines.filter((l) => !/^[-*] /.test(l) && !l.startsWith("#"));
  return (
    <div className="rounded-xl border border-border bg-surface p-5 text-sm">
      {text.map((t, i) => (
        <p key={i} className="mb-2 text-muted">
          {t}
        </p>
      ))}
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
