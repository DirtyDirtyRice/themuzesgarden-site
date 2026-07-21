"use client";

import { useEffect, useState } from "react";

import type { GitImportProgress } from "@/lib/developer-workspace/gitHistoryImporter";

type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function GitHistoryImporterPanel({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState<GitImportProgress | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function poll() {
      try { const response = await fetch("/api/developer-workspace/events/git-history", { cache: "no-store" }); const body: unknown = await response.json(); if (active && response.ok && !isApiError(body)) setProgress(body as GitImportProgress); }
      finally { if (active) window.setTimeout(() => void poll(), 2_000); }
    }
    void poll(); return () => { active = false; };
  }, []);

  async function run() {
    if (requesting || progress?.running) return;
    setRequesting(true); setError("");
    try {
      const response = await fetch("/api/developer-workspace/events/git-history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restart: false }) });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Git history import failed.");
      setProgress(body as GitImportProgress); onComplete();
    } catch (runError) { setError(runError instanceof Error ? runError.message : "Git history import failed."); }
    finally { setRequesting(false); }
  }

  const processed = progress?.processedCommits ?? 0, total = progress?.totalCommits ?? 0;
  const percentage = total ? Math.round((processed / total) * 100) : 0;
  return <div className="mt-4 rounded-lg border border-indigo-300/25 bg-indigo-300/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-black text-indigo-100">Git History Importer</div><p className="mt-1 text-sm text-white/55">Reconstructs symbol history from committed versions without touching current files.</p></div><button type="button" onClick={() => void run()} disabled={requesting || progress?.running} className="rounded border border-indigo-300/50 px-4 py-2 text-sm font-black text-indigo-100 disabled:opacity-40">{requesting || progress?.running ? "Importing history…" : progress?.completedAt ? "Import new commits" : "Import Git history"}</button></div>
    {total ? <div className="mt-3"><div className="h-2 overflow-hidden rounded bg-black/30"><div className="h-full bg-indigo-300 transition-all" style={{ width: `${percentage}%` }} /></div><div className="mt-1 text-xs text-white/45">{processed.toLocaleString()} / {total.toLocaleString()} commits · {progress?.eventCount.toLocaleString() ?? 0} events this run</div></div> : null}
    {progress?.completedAt ? <div className="mt-2 text-xs text-emerald-100/70">Last completed {new Date(progress.completedAt).toLocaleString()}</div> : null}
    {error || progress?.error ? <div className="mt-3 text-sm text-red-100">{error || progress?.error}</div> : null}
  </div>;
}
