"use client";

import { FormEvent, useState } from "react";
import type { ProjectContextBundle } from "@/lib/developer-workspace/projectContext";

type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function ProjectContextInvestigator() {
  const [query, setQuery] = useState("Where is TimelineEngine defined and how is resetEngine used?");
  const [bundle, setBundle] = useState<ProjectContextBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function investigate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/developer-workspace/context?${new URLSearchParams({ query: query.trim() })}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Context request failed.");
      setBundle(body as ProjectContextBundle);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Context request failed."); }
    finally { setLoading(false); }
  }

  return (
    <section className="mt-4 rounded-xl border border-violet-300/25 bg-[#0b1720] p-5">
      <div className="text-xs font-black uppercase tracking-[0.28em] text-violet-300">Project Context Engine</div>
      <h2 className="mt-1 text-2xl font-black">Ask the codebase where to look</h2>
      <p className="mt-2 max-w-3xl text-sm text-white/60">Builds a compact evidence packet for the AI assistant: matching symbols, files, and exact source excerpts.</p>
      <form onSubmit={investigate} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-3 outline-none focus:border-violet-300/70" />
        <button type="submit" disabled={loading || !query.trim()} className="rounded-lg border border-violet-300/50 px-5 py-3 font-black text-violet-100 hover:bg-violet-300/10 disabled:opacity-50">{loading ? "Gathering context…" : "Investigate"}</button>
      </form>
      {error ? <div className="mt-3 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-red-100">{error}</div> : null}
      {bundle ? <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-white/60">
          <span className="rounded bg-white/5 px-2 py-1">{bundle.symbols.length} symbols</span><span className="rounded bg-white/5 px-2 py-1">{bundle.files.length} files</span><span className="rounded bg-white/5 px-2 py-1">{bundle.excerpts.length} excerpts</span><span className="rounded bg-white/5 px-2 py-1">{bundle.characterCount.toLocaleString()} context characters</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3"><h3 className="font-black text-violet-100">Matching symbols</h3><div className="mt-2 max-h-64 space-y-2 overflow-auto">{bundle.symbols.map((symbol) => <div key={symbol.id} className="rounded border border-white/10 p-2 text-sm"><div className="font-bold">{symbol.containerName ? `${symbol.containerName}.` : ""}{symbol.name}</div><div className="text-xs text-white/45">{symbol.kind} · {symbol.path}:{symbol.line}:{symbol.column}</div></div>)}{!bundle.symbols.length ? <p className="text-sm text-white/45">No symbol names matched.</p> : null}</div></div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3"><h3 className="font-black text-violet-100">Matching files</h3><div className="mt-2 max-h-64 space-y-2 overflow-auto">{bundle.files.map((file) => <div key={file.path} className="rounded border border-white/10 p-2 text-sm"><div className="font-bold">{file.name}</div><div className="break-all text-xs text-white/45">{file.path}</div></div>)}{!bundle.files.length ? <p className="text-sm text-white/45">No filenames matched.</p> : null}</div></div>
        </div>
        <div className="space-y-3">{bundle.excerpts.map((excerpt) => <article key={excerpt.id} className="overflow-hidden rounded-lg border border-white/10 bg-[#061016]"><header className="border-b border-white/10 px-3 py-2 text-sm"><span className="font-black text-violet-100">{excerpt.path}:{excerpt.startLine}</span><span className="ml-2 text-white/40">{excerpt.reason}</span></header><pre className="overflow-x-auto p-3 text-xs leading-5 text-white/80">{excerpt.lines.map((line) => `${String(line.number).padStart(5, " ")}  ${line.text}`).join("\n")}</pre></article>)}</div>
      </div> : null}
    </section>
  );
}
