"use client";

import { useState } from "react";

import ErrorInvestigationPanel from "./ErrorInvestigationPanel";
import TemporalErrorOriginPanel from "./TemporalErrorOriginPanel";
import VerificationQueuePanel from "./VerificationQueuePanel";

import type {
  BuildCheckKind,
  BuildCheckResult,
  BuildDiagnostic,
} from "@/lib/developer-workspace/buildDiagnostics";
import type { ProjectFileView } from "@/lib/developer-workspace/projectFile";
import type { DiagnosticTriageReport } from "@/lib/developer-workspace/diagnosticTriage";

type BuildWorkspaceResult = BuildCheckResult & { triage: DiagnosticTriageReport };

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

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) return `${durationMs} ms`;
  const seconds = durationMs / 1_000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function statusClasses(result: BuildCheckResult): string {
  if (result.status === "passed") return "border-emerald-300/40 bg-emerald-300/10 text-emerald-100";
  if (result.status === "timed-out") return "border-orange-300/40 bg-orange-300/10 text-orange-100";
  return "border-red-300/40 bg-red-300/10 text-red-100";
}

export default function BuildErrorWorkspace() {
  const [result, setResult] = useState<BuildWorkspaceResult | null>(null);
  const [running, setRunning] = useState<BuildCheckKind | null>(null);
  const [showCascades, setShowCascades] = useState(false);
  const [selected, setSelected] = useState<BuildDiagnostic | null>(null);
  const [preview, setPreview] = useState<ProjectFileView | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState("");

  async function runCheck(action: BuildCheckKind) {
    setRunning(action);
    setResult(null);
    setSelected(null);
    setPreview(null);
    setError("");

    try {
      const response = await fetch("/api/developer-workspace/build-check", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Build check failed.");
      }
      setResult(body as BuildWorkspaceResult);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Build check failed.");
    } finally {
      setRunning(null);
    }
  }

  async function openDiagnostic(diagnostic: BuildDiagnostic) {
    setSelected(diagnostic);
    setPreview(null);
    if (!diagnostic.file || !diagnostic.line) return;

    setPreviewing(true);
    setError("");
    try {
      const params = new URLSearchParams({
        path: diagnostic.file,
        line: String(Math.max(1, diagnostic.line - 8)),
        count: "40",
      });
      const response = await fetch(`/api/developer-workspace/file?${params.toString()}`, {
        cache: "no-store",
      });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) {
        throw new Error(isApiError(body) ? body.error : "Diagnostic source preview failed.");
      }
      setPreview(body as ProjectFileView);
    } catch (previewError) {
      setError(
        previewError instanceof Error ? previewError.message : "Diagnostic source preview failed."
      );
    } finally {
      setPreviewing(false);
    }
  }

  const visibleDiagnostics =
    result?.diagnostics.filter((diagnostic) => showCascades || diagnostic.primary) ?? [];

  return (
    <section className="mt-4 rounded-xl border border-red-300/20 bg-[#0b1720] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-red-200">
            Compiler and build diagnostics
          </div>
          <h2 className="mt-1 text-2xl font-black">Build Error Workspace</h2>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Run the fast TypeScript gate first. Use the production build after primary diagnostics are
            clear. Every parsed error opens its exact source location.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void runCheck("typecheck")}
            disabled={running !== null}
            className="rounded-lg border border-cyan-300/40 px-4 py-2 text-sm font-black text-cyan-100 disabled:opacity-40"
          >
            {running === "typecheck" ? "Checking TypeScript…" : "Run fast check"}
          </button>
          <button
            type="button"
            onClick={() => void runCheck("build")}
            disabled={running !== null}
            className="rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-black text-emerald-100 disabled:opacity-40"
          >
            {running === "build" ? "Building…" : "Run production build"}
          </button>
        </div>
      </div>

      <VerificationQueuePanel />

      {running ? (
        <div className="mt-4 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4 text-sm text-cyan-100">
          {running === "typecheck"
            ? "Collecting every TypeScript diagnostic. This usually takes under a minute."
            : "Running the complete Next.js production build. Keep this page open until it finishes."}
        </div>
      ) : null}

      {result ? (
        <>
          <div className={`mt-4 rounded-lg border p-4 ${statusClasses(result)}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-2xl font-black uppercase">{result.status}</div>
                <div className="mt-1 text-sm opacity-75">
                  {result.kind === "typecheck" ? "TypeScript check" : "Production build"} · {formatDuration(result.durationMs)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border border-current/20 px-3 py-2">
                  <div className="text-xl font-black">{result.diagnosticCount}</div>
                  <div className="text-[10px] uppercase opacity-60">All</div>
                </div>
                <div className="rounded border border-current/20 px-3 py-2">
                  <div className="text-xl font-black">{result.primaryDiagnosticCount}</div>
                  <div className="text-[10px] uppercase opacity-60">Primary</div>
                </div>
                <div className="rounded border border-current/20 px-3 py-2">
                  <div className="text-xl font-black">
                    {result.diagnosticCount - result.primaryDiagnosticCount}
                  </div>
                  <div className="text-[10px] uppercase opacity-60">Cascade</div>
                </div>
              </div>
            </div>
          </div>

          {result.diagnosticCount ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-sm text-white/50">
                Showing {visibleDiagnostics.length} of {result.diagnosticCount} diagnostics
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={showCascades}
                  onChange={(event) => setShowCascades(event.target.checked)}
                />
                Show likely cascading errors
              </label>
            </div>
          ) : null}

          {result.triage.clusters.length ? (
            <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/5 p-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Recommended repair order</div>
              <div className="mt-3 space-y-2">
                {result.triage.clusters.map((cluster, index) => (
                  <button key={cluster.id} type="button" onClick={() => void openDiagnostic(cluster.primary)} className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-left hover:border-amber-300/35">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-300/35 px-2 py-0.5 text-xs font-black text-amber-100">{index + 1}</span><span className="text-xs font-black uppercase text-white/45">{cluster.category}</span><span className="text-xs text-white/35">{cluster.related.length} cascade(s)</span></div>
                    <div className="mt-2 font-black text-white/85">{cluster.title}</div>
                    <div className="mt-1 text-sm text-white/55">{cluster.primary.file ?? "Build process"}:{cluster.primary.line ?? "?"} · {cluster.primary.code ?? "error"} · {cluster.primary.message}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(320px,0.85fr)_minmax(420px,1.15fr)]">
            <div className="max-h-[64vh] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
              {visibleDiagnostics.map((diagnostic, index) => (
                <button
                  key={diagnostic.id}
                  type="button"
                  onClick={() => void openDiagnostic(diagnostic)}
                  className={[
                    "mb-2 w-full rounded-lg border p-3 text-left",
                    selected?.id === diagnostic.id
                      ? "border-red-300/60 bg-red-300/10"
                      : diagnostic.primary
                        ? "border-red-300/25"
                        : "border-white/10 opacity-60",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-red-300/30 px-2 py-0.5 text-[10px] font-black uppercase text-red-100">
                      {diagnostic.primary ? `Primary ${index + 1}` : "Cascade"}
                    </span>
                    {diagnostic.code ? (
                      <span className="text-xs font-bold text-white/50">{diagnostic.code}</span>
                    ) : null}
                  </div>
                  <div className="mt-2 break-all text-sm font-bold text-white/85">
                    {diagnostic.file
                      ? `${diagnostic.file}:${diagnostic.line ?? "?"}:${diagnostic.column ?? "?"}`
                      : "Build process"}
                  </div>
                  <div className="mt-1 text-sm text-white/60">{diagnostic.message}</div>
                </button>
              ))}

              {!result.diagnosticCount ? (
                <div className="p-8 text-center text-sm text-emerald-100/70">
                  No compiler diagnostics were reported.
                </div>
              ) : null}
            </div>

            <div className="min-w-0 rounded-lg border border-white/10 bg-black/20">
              <div className="border-b border-white/10 p-3">
                <div className="font-black">Error source</div>
                <div className="mt-1 truncate text-xs text-red-100/60">
                  {selected?.file
                    ? `${selected.file}:${selected.line ?? "?"}:${selected.column ?? "?"}`
                    : "Choose a diagnostic to open its exact source."}
                </div>
              </div>

              {preview && selected ? (
                <div className="max-h-[64vh] overflow-auto py-2 font-mono text-[13px] leading-6">
                  {preview.lines.map((line) => {
                    const target = line.number === selected.line;
                    return (
                      <div
                        key={line.number}
                        className={[
                          "grid min-w-max grid-cols-[5rem_1fr]",
                          target ? "bg-red-300/15 text-red-50" : "text-white/70",
                        ].join(" ")}
                      >
                        <span className="border-r border-white/10 px-3 text-right text-white/30">
                          {line.number}
                        </span>
                        <pre className="min-h-6 whitespace-pre px-4">{line.text || " "}</pre>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-white/35">
                  {previewing ? "Opening diagnostic source…" : "No diagnostic selected."}
                </div>
              )}
            </div>
          </div>

          <TemporalErrorOriginPanel diagnostic={selected} />
          <ErrorInvestigationPanel diagnostic={selected} />

          <details className="mt-4 rounded-lg border border-white/10 bg-black/20">
            <summary className="cursor-pointer p-3 text-sm font-black text-white/60">
              Raw command output
              {result.outputTruncated ? " · truncated" : ""}
            </summary>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap border-t border-white/10 p-4 text-xs text-white/55">
              {result.output || "[no output]"}
            </pre>
          </details>
        </>
      ) : null}

      {error ? (
        <div className="mt-4 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
    </section>
  );
}
