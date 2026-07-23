"use client";

import { useState } from "react";

type Baseline = { files: number; symbols: number; relationships: number; newSymbolEvents: number; newRelationshipEvents: number; typecheckStatus: string; diagnostics: number; healthScore: number; criticalRisks: number; highRisks: number };

export default function StandaloneProjectAdoption() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  async function establish() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/developer-workspace/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "baseline" }) });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(typeof body === "object" && body !== null && "error" in body && typeof body.error === "string" ? body.error : "Baseline failed.");
      setBaseline(body as Baseline);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Baseline failed."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mx-4 mt-4 rounded-xl border border-amber-300/25 bg-[#0b1720] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Adopt existing code</div><h2 className="mt-1 text-xl font-black">Establish a trusted starting baseline</h2><p className="mt-1 text-sm text-white/55">Indexes the active project, records its symbols and relationships, runs TypeScript, and saves architectural health.</p></div><button type="button" onClick={() => void establish()} disabled={busy} className="rounded-lg border border-amber-300/45 px-4 py-2 text-sm font-black text-amber-100 disabled:opacity-50">{busy ? "Establishing baseline…" : "Adopt current project"}</button></div>
      {baseline ? <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">{[["Files", baseline.files],["Symbols", baseline.symbols],["Relationships", baseline.relationships],["TypeScript", baseline.typecheckStatus],["Diagnostics", baseline.diagnostics],["Health", baseline.healthScore]].map(([label,value]) => <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-3"><div className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>)}</div> : null}
      {baseline ? <div className="mt-3 text-xs text-white/50">Recorded {baseline.newSymbolEvents} symbol events and {baseline.newRelationshipEvents} relationship events · Risks: {baseline.criticalRisks} critical, {baseline.highRisks} high</div> : null}
      {error ? <div className="mt-3 rounded-lg border border-red-300/40 bg-red-300/10 p-3 text-sm text-red-100">{error}</div> : null}
    </section>
  );
}
