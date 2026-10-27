"use client";

import { MAX_FILES_PER_PROJECT } from "@ifcwise/shared";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FilePicker } from "@/components/file-picker";
import { ProjectFields, readDetails } from "@/components/project-fields";
import { Button, ErrorText, Field, inputClass } from "@/components/ui";
import { attachFiles, createProject } from "@/lib/project-actions";
import { uploadInputs } from "@/lib/upload-client";

type Phase =
  | { kind: "editing" }
  | { kind: "working"; step: string }
  | { kind: "done"; projectId: string; manageToken: string; uploadFailed?: string };

export function NewProjectForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[] | undefined>();
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    if (files.length === 0 && String(data.get("description") ?? "").trim().length < 40) {
      setError("Add at least one file, or describe the building in more detail (40+ characters).");
      return;
    }

    setPhase({ kind: "working", step: "Creating project…" });
    const created = await createProject({
      ...readDetails(data),
      authorName: data.get("authorName"),
      email: data.get("email"),
      consentRights: data.get("consentRights") === "on",
      consentPublic: data.get("consentPublic") === "on",
      website: data.get("website") ?? "",
    });
    if (!created.ok) {
      setPhase({ kind: "editing" });
      setError(created.error);
      return;
    }

    const { projectId, manageToken } = created;
    try {
      setPhase({ kind: "working", step: `Uploading ${files.length} file(s)…` });
      setProgress(files.map(() => 0));
      const uploaded = await uploadInputs(projectId, manageToken, files, (i, pct) =>
        setProgress((prev) => prev?.map((v, j) => (j === i ? pct : v))),
      );
      setPhase({ kind: "working", step: "Submitting…" });
      const attached = await attachFiles(projectId, manageToken, uploaded, true);
      if (!attached.ok) throw new Error(attached.error);
      setPhase({ kind: "done", projectId, manageToken });
    } catch (e) {
      // The project exists as a draft; the manage link lets the creator retry.
      setPhase({
        kind: "done",
        projectId,
        manageToken,
        uploadFailed: e instanceof Error ? e.message : "Upload failed.",
      });
    }
  }

  if (phase.kind === "done") return <CreatedNotice {...phase} />;

  const busy = phase.kind === "working";
  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6">
      <ProjectFields />

      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-medium">Files</p>
        <FilePicker files={files} onChange={setFiles} maxFiles={MAX_FILES_PER_PROJECT} progress={progress} disabled={busy} />
      </div>

      <Field label="Display name" hint="(shown publicly)">
        <input name="authorName" required minLength={2} maxLength={60} autoComplete="nickname" className={inputClass} />
      </Field>
      <Field label="Email" hint="(private — only to tell you when it's ready)">
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} />
      </Field>

      {/* Honeypot — hidden from people, tempting for bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-3 text-sm text-muted sm:col-span-2">
        <label className="flex items-start gap-3">
          <input name="consentRights" type="checkbox" required className="mt-0.5 size-4 accent-[var(--accent)]" />
          <span>I have the right to share these files and to have a model made from them.</span>
        </label>
        <label className="flex items-start gap-3">
          <input name="consentPublic" type="checkbox" required className="mt-0.5 size-4 accent-[var(--accent)]" />
          <span>
            I understand this project — description, files and model — will be <strong className="text-foreground">public</strong>.
            No confidential drawings or personal details.
          </span>
        </label>
      </div>

      {error && (
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? phase.step : "Create project"}
        </Button>
      </div>
    </form>
  );
}

function CreatedNotice({ projectId, manageToken, uploadFailed }: { projectId: string; manageToken: string; uploadFailed?: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const projectUrl = `${origin}/p/${projectId}`;
  const manageUrl = `${origin}/p/${projectId}/manage?t=${manageToken}`;
  return (
    <div role="status" className="space-y-5 rounded-xl border border-accent/40 bg-accent-soft/30 p-6">
      {uploadFailed ? (
        <div>
          <p className="font-semibold">Your project was saved as a draft, but the upload didn&apos;t finish.</p>
          <p className="mt-1 text-sm text-muted">{uploadFailed} Open your manage link to add the files and submit.</p>
        </div>
      ) : (
        <div>
          <p className="font-semibold">Project submitted.</p>
          <p className="mt-1 text-sm text-muted">
            We&apos;ll review it, publish it in the gallery and email you when the IFC model is ready.
          </p>
        </div>
      )}
      <CopyRow label="Project page" value={projectUrl} />
      <CopyRow label="Your private manage link — save it now, it's shown only once" value={manageUrl} />
      <div className="flex flex-wrap gap-3">
        <Link href={`/p/${projectId}`} className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
          View project
        </Link>
        <Link href={`/p/${projectId}/manage?t=${manageToken}`} className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium">
          Manage project
        </Link>
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1.5 flex gap-2">
        <input readOnly value={value} onFocus={(e) => e.target.select()} className={`${inputClass} mt-0 font-mono text-xs`} />
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
