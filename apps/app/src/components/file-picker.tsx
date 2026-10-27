"use client";

import { ALLOWED_UPLOAD_EXTENSIONS, MAX_FILE_BYTES } from "@ifcwise/shared";
import { useRef, useState, type DragEvent } from "react";
import { formatBytes } from "@/components/ui";
import { isAllowedInput } from "@/lib/blob-paths";

export function FilePicker({
  files,
  onChange,
  maxFiles,
  progress,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles: number;
  progress?: number[];
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  function add(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const rejected = incoming.filter((f) => !isAllowedInput(f.name) || f.size > MAX_FILE_BYTES);
    const accepted = incoming.filter((f) => !rejected.includes(f));
    const next = [...files, ...accepted].slice(0, maxFiles);
    setProblem(
      rejected.length
        ? `Skipped ${rejected.map((f) => f.name).join(", ")} — unsupported type or larger than ${formatBytes(MAX_FILE_BYTES)}.`
        : files.length + accepted.length > maxFiles
          ? `Only ${maxFiles} files allowed.`
          : null,
    );
    onChange(next);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) add(event.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm ${
          dragging ? "border-accent bg-accent-soft/40" : "border-border bg-background"
        }`}
      >
        <p className="font-medium">Drop files here</p>
        <p className="text-muted">
          {ALLOWED_UPLOAD_EXTENSIONS.join(" ")} · up to {formatBytes(MAX_FILE_BYTES)} each · max {maxFiles} files
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-md border border-border bg-surface px-4 py-2 font-medium hover:border-subtle disabled:opacity-60"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept={ALLOWED_UPLOAD_EXTENSIONS.join(",")}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {problem && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{problem}</p>}
      {files.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 font-mono text-xs text-muted">
                {progress?.[i] !== undefined ? `${Math.round(progress[i])}%` : formatBytes(file.size)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="shrink-0 text-muted hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
