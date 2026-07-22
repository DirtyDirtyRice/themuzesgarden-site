"use client";

import { useEffect, useState } from "react";

import type { BuildCheckResult } from "@/lib/developer-workspace/buildDiagnostics";
import type { SafePatchPreview, SafePatchProposal, SafePatchResult } from "@/lib/developer-workspace/safePatchExecutor";

type ApiError = { error: string };
function isApiError(value: unknown): value is ApiError { return typeof value === "object" && value !== null && "error" in value && typeof value.error === "string"; }

export default function SafePatchControls({ proposal }: { proposal: SafePatchProposal | null }) {
  const [preview, setPreview] = useState<SafePatchPreview | null>(null);
  const [result, setResult] = useState<SafePatchResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { setPreview(null); setResult(null); setError(""); }, [proposal]);

  async function request(action: "preview" | "apply") {
    if (!proposal || busy) return;
    setBusy(action); setError("");
    try {
      const response = await fetch("/api/developer-workspace/safe-patch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, proposal, expectedHash: preview?.beforeHash, confirmed: action === "apply" }) });
      const body: unknown = await response.json();
      if (!response.ok || isApiError(body)) throw new Error(isApiError(body) ? body.error : "Safe patch request failed.");
      if (action === "preview") setPreview(body as SafePatchPreview); else setResult(body as SafePatchResult);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Safe patch request failed."); }
    finally { setBusy(null); }
  }

  if (!proposal) return <div className="mt-4 rounded border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100/70">The investigator did not have enough evidence to propose a safe patch.</div>;
  const verification: BuildCheckResult | null = result?.verification ?? null;
  const architectureGate = result?.architectureGate ?? null;
  return <div className="mt-4 rounded-lg border border-cyan-300/25 bg-cyan-300/5 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-black text-cyan-100">Safe Patch Executor</div><div className="mt-1 text-sm text-white/55">{proposal.file}:{proposal.startLine}-{proposal.endLine} · {proposal.explanation}</div></div><div className="flex gap-2"><button type="button" onClick={() => void request("preview")} disabled={busy !== null || result?.applied} className="rounded border border-cyan-300/40 px-3 py-2 text-sm font-bold text-cyan-100 disabled:opacity-40">{busy === "preview" ? "Checking…" : "Preview exact patch"}</button><button type="button" onClick={() => void request("apply")} disabled={!preview || busy !== null || Boolean(result)} className="rounded border border-emerald-300/50 px-3 py-2 text-sm font-black text-emerald-100 disabled:opacity-40">{busy === "apply" ? "Applying and verifying…" : "Apply + verify"}</button></div></div>
    {preview ? <div className="mt-3 grid gap-3 lg:grid-cols-2"><div className="overflow-auto rounded border border-red-300/20 bg-red-300/5 p-3"><div className="mb-2 text-xs font-black uppercase text-red-200">Before</div><pre className="text-xs text-white/70">{preview.before.join("\n")}</pre></div><div className="overflow-auto rounded border border-emerald-300/20 bg-emerald-300/5 p-3"><div className="mb-2 text-xs font-black uppercase text-emerald-200">After</div><pre className="text-xs text-white/70">{preview.after.join("\n")}</pre></div></div> : null}
    {verification ? <div className={`mt-3 rounded border p-3 text-sm ${result?.applied ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100" : "border-orange-300/30 bg-orange-300/10 text-orange-100"}`}>{result?.applied ? "Patch applied. TypeScript and architectural verification passed." : architectureGate && !architectureGate.passed ? "Architecture regressed. The original file was restored automatically." : "TypeScript verification failed. The original file was restored automatically."} ({verification.diagnosticCount} diagnostics)</div> : null}
    {architectureGate ? <div className={`mt-3 rounded border p-3 text-sm ${architectureGate.passed ? "border-emerald-300/25 bg-emerald-300/5" : "border-red-300/35 bg-red-300/10"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black">Architectural Regression Gate: {architectureGate.passed ? "PASSED" : "BLOCKED"}</span><span className="text-xs text-white/60">Health {architectureGate.previousHealthScore} → {architectureGate.currentHealthScore} ({architectureGate.healthScoreDelta > 0 ? "+" : ""}{architectureGate.healthScoreDelta})</span></div>{architectureGate.reasons.length ? <div className="mt-2 space-y-2">{architectureGate.reasons.map((reason, index) => <div key={`${reason.code}:${reason.path ?? "project"}:${index}`} className="rounded border border-white/10 bg-black/20 p-2"><div className="text-xs font-black">{reason.code}</div><div className="mt-1 text-xs text-white/70">{reason.message}</div>{reason.path ? <div className="mt-1 break-all font-mono text-[11px] text-white/45">{reason.path}{reason.relatedPath ? ` ↔ ${reason.relatedPath}` : ""}</div> : null}</div>)}</div> : null}</div> : null}
    {result?.preventedErrorEventId ? <div className="mt-3 rounded border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100"><span className="font-black">Recorded in Prevented Error Ledger</span><div className="mt-1 break-all font-mono text-amber-100/70">{result.preventedErrorEventId}</div></div> : null}
    {error ? <div className="mt-3 rounded border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
  </div>;
}
