"use client";

import { ALLOWED_OUTPUT_EXTENSIONS, MAX_FILES_PER_PROJECT, PROJECT_STATUSES, PROJECT_STATUS_LABELS, type PublicProject } from "@ifcwise/shared";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { FilePicker } from "@/components/file-picker";
import { Button, ErrorText, inputClass } from "@/components/ui";
import { adminDeleteProject, attachOutputs, removeOutput, setMessage, setPublished, setStatus } from "@/lib/admin-actions";
import { isAllowedOutput } from "@/lib/blob-paths";
import type { ActionResult } from "@/lib/project-actions";
import { uploadOutputs } from "@/lib/upload-client";

export function AdminPanel({ project, email }: { project: PublicProject; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[] | undefined>();

  function run(action: () => Promise<ActionResult>, success: string, after?: () => void) {
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setNotice({ kind: "error", text: result.error });
      setNotice({ kind: "ok", text: success });
      after?.();
      router.refresh();
    });
  }

  function onStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(() => setStatus(project.id, data.get("status"), data.get("note") ?? ""), "Status updated.");
  }

  function onMessage(askQuestion: boolean) {
    const text = (document.getElementById("admin-message") as HTMLTextAreaElement).value;
    run(() => setMessage(project.id, text, askQuestion), askQuestion ? "Question sent (status: needs info)." : "Message saved.");
  }

  function onUpload(complete: boolean) {
    run(
      async () => {
        try {
          setProgress(files.map(() => 0));
          const uploaded = await uploadOutputs(project.id, files, (i, pct) =>
            setProgress((prev) => prev?.map((v, j) => (j === i ? pct : v))),
          );
          return await attachOutputs(project.id, uploaded, complete);
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
        } finally {
          setProgress(undefined);
        }
      },
      complete ? "Outputs uploaded, project completed." : "Outputs uploaded.",
      () => setFiles([]),
    );
  }

  function onDelete() {
    if (!window.confirm(`Delete "${project.title}" and all its files permanently?`)) return;
    run(() => adminDeleteProject(project.id), "Deleted.", () => router.push("/admin"));
  }

  const pullCommand = `npm run tools -- pull ${project.id}`;
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      {notice &&
        (notice.kind === "error" ? (
          <ErrorText>{notice.text}</ErrorText>
        ) : (
          <p role="status" className="text-sm text-accent">
            {notice.text}
          </p>
        ))}

      <Card title="Creator">
        <p className="text-sm">{project.authorName}</p>
        <a href={`mailto:${email}?subject=${encodeURIComponent(`Your IFCWise project: ${project.title}`)}`} className="text-sm break-all text-accent hover:underline">
          {email}
        </a>
      </Card>

      <Card title="Visibility">
        <p className="text-sm text-muted">{project.published ? "Listed in the public gallery." : "Not listed — reachable by link only."}</p>
        <Button className="mt-3" variant={project.published ? "secondary" : "primary"} disabled={pending} onClick={() => run(() => setPublished(project.id, !project.published), project.published ? "Unpublished." : "Published.")}>
          {project.published ? "Unpublish" : "Approve & publish"}
        </Button>
      </Card>

      <Card title="Status">
        <form onSubmit={onStatus} className="space-y-3">
          <select name="status" defaultValue={project.status} className={inputClass}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <input name="note" maxLength={3000} placeholder="Note for the history (optional, public)" className={inputClass} />
          <Button type="submit" variant="secondary" disabled={pending}>
            Update status
          </Button>
        </form>
      </Card>

      <Card title="Message to creator (public)">
        <textarea id="admin-message" rows={3} maxLength={3000} defaultValue={project.adminMessage} placeholder="e.g. What is the wall height on the first floor?" className={inputClass} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => onMessage(true)}>
            Ask question
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => onMessage(false)}>
            Save as note
          </Button>
        </div>
      </Card>

      <Card title="Model output">
        {project.outputs.length > 0 && (
          <ul className="mb-3 divide-y divide-border rounded-lg border border-border text-sm">
            {project.outputs.map((f) => (
              <li key={f.pathname} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate">{f.filename}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeOutput(project.id, f.pathname), "Output removed.")}
                  className="text-xs text-muted hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <FilePicker
          files={files}
          onChange={setFiles}
          maxFiles={MAX_FILES_PER_PROJECT}
          progress={progress}
          disabled={pending}
          accept={ALLOWED_OUTPUT_EXTENSIONS}
          isAllowed={isAllowedOutput}
        />
        <p className="mt-2 text-xs text-muted">model.ifc, summary.json, assumptions.md, preview.png</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button disabled={pending || !files.length} onClick={() => onUpload(true)}>
            Upload & complete
          </Button>
          <Button variant="secondary" disabled={pending || !files.length} onClick={() => onUpload(false)}>
            Upload only
          </Button>
        </div>
      </Card>

      <Card title="Work locally">
        <code className="block rounded bg-background px-3 py-2 font-mono text-xs break-all">{pullCommand}</code>
        <Button variant="secondary" className="mt-3" onClick={() => navigator.clipboard.writeText(pullCommand)}>
          Copy pull command
        </Button>
      </Card>

      <Card title="Danger zone">
        <Button variant="danger" disabled={pending} onClick={onDelete}>
          Delete project
        </Button>
      </Card>
    </aside>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
