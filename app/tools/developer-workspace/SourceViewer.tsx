"use client";

import { useCallback, useEffect, useState } from "react";

import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";
import type { ProjectEntry } from "@/lib/developer-workspace/projectIndex";

type Props = {
  entry: ProjectEntry | null;
};

type ApiError = {
  error: string;
};

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export default function SourceViewer({ entry }: Props) {
  const [file, setFile] = useState<ProjectFileView | null>(null);
  const [lineInput, setLineInput] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFile = useCallback(async (sourceEntry: ProjectEntry, startLine: number) => {
    if (sourceEntry.kind !== "file") return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        path: sourceEntry.path,
        line: String(startLine),
        count: "300",
      });
      const response = await fetch(`/api/developer-workspace/file?${params.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Project file request failed.");
      }

      const nextFile = body as ProjectFileView;
      setFile(nextFile);
      setLineInput(String(nextFile.startLine));
    } catch (loadError) {
      setFile(null);
      setError(loadError instanceof Error ? loadError.message : "Project file request failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!entry || entry.kind !== "file") {
      setFile(null);
      setError("");
      return;
    }

    void loadFile(entry, 1);
  }, [entry, loadFile]);

  function goToLine() {
    if (!entry || entry.kind !== "file") return;

    const line = Number(lineInput);
    if (!Number.isInteger(line) || line < 1) {
      setError("Line number must be a positive integer.");
      return;
    }

    void loadFile(entry, line);
  }

  const canOpen = entry?.kind === "file";

  return (
    <section className="mt-4 rounded-lg border border-white/10 bg-black/25">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-3">
        <div className="min-w-0">
          <h3 className="font-black">Source viewer</h3>
          <div className="mt-1 truncate text-xs text-cyan-100/70">
            {file?.path ?? (canOpen ? entry.path : "Select a source file to open it.")}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!entry || !file || file.startLine <= 1 || loading}
            onClick={() => {
              if (entry && file) void loadFile(entry, Math.max(1, file.startLine - 300));
            }}
            className="rounded border border-white/15 px-3 py-2 text-xs font-bold disabled:opacity-35"
          >
            Previous 300
          </button>
          <button
            type="button"
            disabled={!entry || !file || file.endLine >= file.totalLines || loading}
            onClick={() => {
              if (entry && file) void loadFile(entry, file.endLine + 1);
            }}
            className="rounded border border-white/15 px-3 py-2 text-xs font-bold disabled:opacity-35"
          >
            Next 300
          </button>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              goToLine();
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="source-line" className="text-xs text-white/55">
              Line
            </label>
            <input
              id="source-line"
              inputMode="numeric"
              value={lineInput}
              onChange={(event) => setLineInput(event.target.value)}
              className="w-24 rounded border border-white/15 bg-black px-2 py-2 text-sm outline-none focus:border-cyan-300/70"
            />
            <button
              type="submit"
              disabled={!canOpen || loading}
              className="rounded border border-cyan-300/40 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-35"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {error ? (
        <div className="border-b border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {file ? (
        <>
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-white/10 px-3 py-2 text-xs text-white/45">
            <span>{file.language}</span>
            <span>{file.totalLines.toLocaleString()} lines</span>
            <span>
              Showing {file.startLine.toLocaleString()}–{file.endLine.toLocaleString()}
            </span>
            <span>{formatBytes(file.size)}</span>
          </div>
          <div className="max-h-[68vh] overflow-auto py-2 font-mono text-[13px] leading-6">
            {file.lines.map((line) => (
              <div
                key={line.number}
                id={`source-line-${line.number}`}
                className="grid min-w-max grid-cols-[5rem_1fr] hover:bg-cyan-300/5"
              >
                <button
                  type="button"
                  onClick={() => setLineInput(String(line.number))}
                  className="select-none border-r border-white/10 px-3 text-right text-white/30 hover:text-cyan-200"
                  title={`Select line ${line.number}`}
                >
                  {line.number}
                </button>
                <pre className="min-h-6 whitespace-pre px-4 text-white/80">{line.text || " "}</pre>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-sm text-white/40">
          {loading ? "Opening source file…" : "Choose a file from the project tree or search results."}
        </div>
      )}
    </section>
  );
}
