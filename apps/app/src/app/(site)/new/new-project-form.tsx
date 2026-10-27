"use client";

import { MAX_FILES_PER_PROJECT } from "@ifcwise/shared";
import { buttonClass } from "@ifcwise/ui";
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
    <form onSubmit={onSubmit} className="space-y-6">
      <Step n={1} title="About the building" description="A title and a short description. Mention known dimensions, heights and anything unclear in the drawings.">
        <div className="grid gap-5 sm:grid-cols-2">
          <ProjectFields />
        </div>
      </Step>

      <Step n={2} title="Drawings and files" description="DWG/DXF, PDF plans, images or sketches. Optional if the description says enough.">
        <FilePicker files={files} onChange={setFiles} maxFiles={MAX_FILES_PER_PROJECT} progress={progress} disabled={busy} />
      </Step>

      <Step n={3} title="About you" description="Your display name is shown on the project. Your email stays private.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name">
            <input name="authorName" required minLength={2} maxLength={60} autoComplete="nickname" placeholder="e.g. Studio Nord" className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </Field>
        </div>

        {/* Honeypot — hidden from people, tempting for bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="mt-6 space-y-3 rounded-xl bg-surface p-4 text-sm text-muted">
          <label className="flex items-start gap-3">
            <input name="consentRights" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
            <span>I have the right to share these files and to have a model made from them.</span>
          </label>
          <label className="flex items-start gap-3">
            <input name="consentPublic" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
            <span>
              I understand this project — description, files and model — will be <strong className="text-foreground">public</strong>.
              No confidential drawings or personal details.
            </span>
          </label>
        </div>
      </Step>

      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy} className="h-12 px-6 text-[15px]">
          {busy ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              {phase.step}
            </>
          ) : (
            "Create project"
          )}
        </Button>
        <p className="text-xs text-muted">Free during early access · usually 24–48 h</p>
      </div>
    </form>
  );
}

function Step({ n, title, description, children }: { n: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-soft sm:p-7">
      <div className="mb-5 flex gap-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">{n}</span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CreatedNotice({ projectId, manageToken, uploadFailed }: { projectId: string; manageToken: string; uploadFailed?: string }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const projectUrl = `${origin}/p/${projectId}`;
  const manageUrl = `${origin}/p/${projectId}/manage?t=${manageToken}`;
  return (
    <div role="status" className="space-y-5 rounded-2xl border border-accent/40 bg-background p-6 shadow-float sm:p-8">
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
        <Link href={`/p/${projectId}`} className={buttonClass("accent", "md")}>
          View project
        </Link>
        <Link href={`/p/${projectId}/manage?t=${manageToken}`} className={buttonClass("secondary", "md")}>
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
