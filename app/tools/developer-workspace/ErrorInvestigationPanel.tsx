"use client";

import { useEffect, useState } from "react";

import SafePatchControls from "./SafePatchControls";

import type { BuildDiagnostic } from "@/lib/developer-workspace/buildDiagnostics";
import type { SafePatchProposal } from "@/lib/developer-workspace/safePatchExecutor";

type Investigation = { answer: string; model: string; proposal: SafePatchProposal | null; contextCharacters: number; context: { symbols: number; files: number; excerpts: number }; citations: Array<{ path: string; startLine: number; endLine: number; reason: string }> };
type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function ErrorInvestigationPanel({ diagnostic }: { diagnostic: BuildDiagnostic | null }) {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setInvestigation(null); setError(""); }, [diagnostic?.id]);

  async function investigate() {
    if (!diagnostic || loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/developer-workspace/error-investigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diagnostic }) });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Error investigation failed.");
      setInvestigation(body as Investigation);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Error investigation failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="mt-4 rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-200">AI Error Investigator</div><p className="mt-1 text-sm text-white/55">Diagnoses the selected error from indexed evidence and proposes a reviewable minimal patch.</p></div>
        <button type="button" onClick={() => void investigate()} disabled={!diagnostic || loading} className="rounded-lg border border-fuchsia-300/50 px-4 py-2 text-sm font-black text-fuchsia-100 hover:bg-fuchsia-300/10 disabled:opacity-40">{loading ? "Investigating…" : "Investigate selected error"}</button>
      </div>
      {!diagnostic ? <div className="mt-3 text-sm text-white/35">Select a compiler diagnostic first.</div> : null}
      {error ? <div className="mt-3 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
      {investigation ? <div className="mt-4"><div className="whitespace-pre-wrap rounded-lg border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/80">{investigation.answer}</div><div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45"><span>{investigation.context.symbols} symbols</span><span>·</span><span>{investigation.context.files} files</span><span>·</span><span>{investigation.context.excerpts} excerpts</span><span>·</span><span>{investigation.contextCharacters.toLocaleString()} characters</span><span>·</span><span>{investigation.model}</span></div><SafePatchControls proposal={investigation.proposal} /><details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-fuchsia-100/70">Evidence supplied to the investigator</summary><div className="mt-2 space-y-1 text-xs text-white/50">{investigation.citations.map((citation) => <div key={`${citation.path}:${citation.startLine}`}>{citation.path}:{citation.startLine}-{citation.endLine} · {citation.reason}</div>)}</div></details></div> : null}
    </div>
  );
}
