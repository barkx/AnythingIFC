"use client";

import { MAX_FILES_PER_PROJECT, type PublicProject } from "@ifcwise/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { FilePicker } from "@/components/file-picker";
import { ProjectFields, readDetails } from "@/components/project-fields";
import { Button, ErrorText, StatusBadge, SuccessText, inputClass } from "@/components/ui";
import { attachFiles, deleteProject, replyToAdmin, submitDraft, updateDetails, type ActionResult } from "@/lib/project-actions";
import { uploadInputs } from "@/lib/upload-client";

export function ManagePanel({ project, manageToken }: { project: PublicProject; manageToken: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[] | undefined>();
  const [deleted, setDeleted] = useState(false);

  function run(action: () => Promise<ActionResult>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      setMessage({ kind: "ok", text: success });
      router.refresh();
    });
  }

  function onSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = readDetails(new FormData(event.currentTarget));
    run(() => updateDetails(project.id, manageToken, details), "Details saved.");
  }

  function onReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const reply = new FormData(form).get("reply");
    run(async () => {
      const result = await replyToAdmin(project.id, manageToken, reply);
      if (result.ok) form.reset();
      return result;
    }, "Reply sent.");
  }

  function onUpload() {
    run(async () => {
      try {
        setProgress(files.map(() => 0));
        const uploaded = await uploadInputs(project.id, manageToken, files, (i, pct) =>
          setProgress((prev) => prev?.map((v, j) => (j === i ? pct : v))),
        );
        const result = await attachFiles(project.id, manageToken, uploaded, false);
        if (result.ok) setFiles([]);
        return result;
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
      } finally {
        setProgress(undefined);
      }
    }, "Files added.");
  }

  function onDelete() {
    if (!window.confirm("Delete this project and all its files permanently?")) return;
    run(async () => {
      const result = await deleteProject(project.id, manageToken);
      if (result.ok) setDeleted(true);
      return result;
    }, "Project deleted.");
  }

  if (deleted) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">Project deleted</h1>
        <p className="text-muted">The project and all its files have been removed.</p>
        <Link href="/new" className="text-accent hover:underline">
          Start a new project
        </Link>
      </div>
    );
  }

  const remaining = MAX_FILES_PER_PROJECT - project.inputs.length;
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-accent">Manage project</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight break-words sm:text-4xl">{project.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <StatusBadge status={project.status} />
          <Link href={`/p/${project.id}`} className="text-accent hover:underline">
            View public page
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted">Keep this page&apos;s link private — anyone with it can edit or delete the project.</p>
      </header>

      {message && (message.kind === "error" ? <ErrorText>{message.text}</ErrorText> : <SuccessText>{message.text}</SuccessText>)}

      {project.status === "draft" && (
        <Card title="Finish submitting">
          <p className="text-sm text-muted">
            This project is still a draft{project.inputs.length ? ` with ${project.inputs.length} file(s)` : ""}. Add any
            missing files below, then submit it for modelling.
          </p>
          <Button className="mt-4" disabled={pending} onClick={() => run(() => submitDraft(project.id, manageToken), "Project submitted.")}>
            Submit project
          </Button>
        </Card>
      )}

      {project.adminMessage && (
        <Card title="Message from IFCWise">
          <p className="whitespace-pre-wrap text-sm">{project.adminMessage}</p>
          <form onSubmit={onReply} className="mt-4 space-y-3">
            <textarea name="reply" required rows={3} maxLength={3000} placeholder="Your answer…" className={inputClass} />
            <Button type="submit" disabled={pending}>
              Send reply
            </Button>
          </form>
        </Card>
      )}

      <Card title="Add files">
        {remaining > 0 ? (
          <>
            <FilePicker files={files} onChange={setFiles} maxFiles={remaining} progress={progress} disabled={pending} />
            <Button className="mt-4" disabled={pending || files.length === 0} onClick={onUpload}>
              {pending && progress ? "Uploading…" : "Upload files"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted">This project already has the maximum of {MAX_FILES_PER_PROJECT} files.</p>
        )}
      </Card>

      <Card title="Details">
        <form onSubmit={onSaveDetails} className="grid gap-5 sm:grid-cols-2">
          <ProjectFields defaults={project} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              Save details
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Delete project">
        <p className="text-sm text-muted">Removes the project page, all uploaded files and any model. This can&apos;t be undone.</p>
        <Button variant="danger" className="mt-4" disabled={pending} onClick={onDelete}>
          Delete project
        </Button>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-5 shadow-soft sm:p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
