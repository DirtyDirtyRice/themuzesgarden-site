"use client";

import { useEffect, useState } from "react";

import type { BuildDiagnostic } from "@/lib/developer-workspace/buildDiagnostics";
import type { TemporalErrorOriginReport } from "@/lib/developer-workspace/temporalErrorOrigin";

type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function TemporalErrorOriginPanel({ diagnostic }: { diagnostic: BuildDiagnostic | null }) {
  const [report, setReport] = useState<TemporalErrorOriginReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setReport(null); setError(""); }, [diagnostic?.id]);

  async function trace() {
    if (!diagnostic || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/developer-workspace/error-origin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diagnostic }) });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Origin trace failed.");
      setReport(body as TemporalErrorOriginReport);
    } catch (traceError) { setError(traceError instanceof Error ? traceError.message : "Origin trace failed."); }
    finally { setLoading(false); }
  }

  return <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Reverse breadcrumbs</div><div className="mt-1 font-black">Temporal Error Origin</div><p className="mt-1 text-sm text-white/55">Correlates this error with symbol births, changes, dependencies, builds, and Git commits.</p></div><button type="button" onClick={() => void trace()} disabled={!diagnostic || loading} className="rounded border border-amber-300/50 px-4 py-2 text-sm font-black text-amber-100 disabled:opacity-40">{loading ? "Tracing history…" : "Trace likely origin"}</button></div>
    {error ? <div className="mt-3 text-sm text-red-100">{error}</div> : null}
    {report ? <div className="mt-4 space-y-4"><div className="flex flex-wrap gap-2 text-xs text-white/50"><span>{report.nearbySymbols.length} nearby symbols</span><span>·</span><span>{report.relatedRelationships.length} relationships</span><span>·</span><span>{report.candidates.length} ranked candidates</span><span>·</span><span>{report.errorHistory.length} recorded error events</span></div>
      <div className="space-y-2">{report.candidates.slice(0, 8).map((candidate, index) => <div key={candidate.event.id} className="rounded border border-white/10 bg-black/20 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">#{index + 1} {candidate.event.symbolName}</span><span className={`rounded px-2 py-0.5 text-xs font-black uppercase ${candidate.confidence === "high" ? "bg-emerald-300/15 text-emerald-100" : candidate.confidence === "medium" ? "bg-amber-300/15 text-amber-100" : "bg-white/10 text-white/60"}`}>{candidate.confidence} · {candidate.score}</span></div><div className="mt-1 text-xs text-amber-100/65">{candidate.event.kind} · {candidate.event.path}:{candidate.event.line} · {new Date(candidate.event.occurredAt).toLocaleString()}</div>{candidate.event.gitCommit ? <div className="mt-1 text-xs text-indigo-100/60">{candidate.event.gitCommit.slice(0, 8)} · {candidate.event.gitAuthor} · {candidate.event.gitSubject}</div> : null}<div className="mt-2 text-sm text-white/60">{candidate.reasons.join("; ")}</div></div>)}</div>
      {report.impactReports.some((impact) => impact.totalCount > 0) ? <details open className="rounded border border-orange-300/20 bg-orange-300/5 p-3"><summary className="cursor-pointer text-sm font-black text-orange-100">Current blast radius · {report.impactReports.reduce((total, impact) => total + impact.totalCount, 0)} downstream result(s)</summary><div className="mt-3 space-y-3">{report.impactReports.filter((impact) => impact.totalCount > 0).map((impact) => <div key={`${impact.subject.path}:${impact.subject.symbolName}:${impact.subject.line}`} className="rounded border border-white/10 bg-black/20 p-3"><div className="font-bold">{impact.subject.symbolName} <span className="text-xs font-normal text-white/45">at {impact.subject.path}:{impact.subject.line}</span></div><div className="mt-1 text-xs text-white/50">{impact.directCount} direct · {impact.totalCount - impact.directCount} downstream</div><div className="mt-2 space-y-1">{impact.impacts.slice(0, 12).map((file) => <div key={file.path} className="rounded bg-black/20 px-2 py-1 text-xs"><span className={file.risk === "high" ? "text-red-100" : file.risk === "medium" ? "text-amber-100" : "text-sky-100"}>{file.risk}</span><span className="text-white/35"> · depth {file.depth} · </span><span className="text-white/70">{file.path}</span></div>)}</div>{impact.totalCount > 12 ? <div className="mt-2 text-xs text-white/35">{impact.totalCount - 12} additional impacted files are available in Symbol Explorer.</div> : null}</div>)}</div></details> : <div className="rounded border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-100/65">No downstream files depend on the nearest error symbols.</div>}      {report.breadcrumbs.length ? <details><summary className="cursor-pointer text-sm font-black text-amber-100">Chronological breadcrumb path</summary><div className="mt-2 border-l border-amber-300/25 pl-4">{report.breadcrumbs.map((crumb) => <div key={`${crumb.occurredAt}:${crumb.title}:${crumb.path}`} className="relative mb-3"><span className="absolute -left-[1.2rem] top-1 h-2 w-2 rounded-full bg-amber-300" /><div className="text-xs text-white/40">{new Date(crumb.occurredAt).toLocaleString()}</div><div className="font-bold">{crumb.title}</div><div className="text-xs text-white/50">{crumb.path}:{crumb.line}{crumb.commit ? ` · ${crumb.commit.slice(0, 8)}` : ""}</div></div>)}</div></details> : null}
    </div> : null}
  </div>;
}
