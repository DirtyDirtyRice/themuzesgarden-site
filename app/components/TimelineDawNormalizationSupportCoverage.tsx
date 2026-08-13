"use client";

import { useCallback, useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import { parseTimelineDawNormalizationCoverageEvidence } from "@/lib/timeline/TimelineDawNormalizationSupportCoveragePolicy";

type Subject = { type: "export" | "revocation"; id: string; checksum: string; createdAt: string };
type Coverage = { totals: { export: number; revocation: number }; covered: { export: number; revocation: number }; unchained: Subject[]; complete: boolean; percent: number };
type Data = { coverage: Coverage; plan: { baseHeadHash: string | null; planChecksum: string; subjects: Subject[] }; backfills: Array<{ id: string; subject_count: number; export_count: number; revocation_count: number; final_head_hash: string | null; created_at: string }> };

const button = "rounded border border-white/20 px-2 py-1 disabled:opacity-40";

export default function TimelineDawNormalizationSupportCoverage({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [verified, setVerified] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = async () => (await requireProjectSupabase().auth.getSession()).data.session?.access_token ?? "";
  const load = useCallback(async () => {
    const response = await fetch(`/api/timeline/daw-normalization-support-chain-coverage?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${await token()}` } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error);
    setData(payload);
  }, [sessionId]);
  useEffect(() => {
    // Loading is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Coverage could not be loaded."));
  }, [load]);

  async function backfill() {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/timeline/daw-normalization-support-chain-coverage", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, plan: data.plan, confirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      const blob = new Blob([JSON.stringify(payload.evidence, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = payload.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setConfirmation("");
      await load();
    } finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.04] p-4 text-xs">
    <div className="flex flex-wrap items-center gap-2"><strong>Evidence chain coverage</strong><span className={data?.coverage.complete ? "text-emerald-200" : "text-amber-200"}>{data ? `${data.coverage.percent}% covered` : "Measuring…"}</span></div>
    {data ? <>
      <p>Exports: {data.coverage.covered.export}/{data.coverage.totals.export} · Revocations: {data.coverage.covered.revocation}/{data.coverage.totals.revocation} · Unchained: {data.coverage.unchained.length}</p>
      {data.coverage.unchained.slice(0, 8).map((subject) => <p key={`${subject.type}:${subject.id}`} className="text-amber-100">Waiting: {subject.type} · {subject.id}</p>)}
      {data.coverage.unchained.length > 8 ? <p>+ {data.coverage.unchained.length - 8} more unchained events</p> : null}
      <div className="mt-2 flex flex-wrap gap-2"><input className="bg-black" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="BACKFILL EVIDENCE CHAIN"/><button className={button} disabled={busy || data.coverage.complete || confirmation !== "BACKFILL EVIDENCE CHAIN"} onClick={() => void backfill().catch((cause) => setError(cause instanceof Error ? cause.message : "Backfill failed."))}>{busy ? "Backfilling…" : "Backfill and download receipt"}</button><label className={button}>Verify receipt<input className="hidden" type="file" accept=".json,application/json" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const evidence = parseTimelineDawNormalizationCoverageEvidence(JSON.parse(await file.text())); setVerified(String(evidence.checksum)); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "Receipt is invalid."); } }}/></label></div>
      {data.backfills.slice(0, 5).map((receipt) => <p key={receipt.id}>Backfill {receipt.id.slice(-12)} · {receipt.subject_count} events ({receipt.export_count} exports, {receipt.revocation_count} revocations) · {new Date(receipt.created_at).toLocaleString()}</p>)}
    </> : null}
    {verified ? <p className="text-emerald-200">Portable coverage receipt verified locally: {verified.slice(7, 19)}.</p> : null}
    <p className="text-white/45">Historical exports and revocations stay inactive until every ledger event is chained. Backfill only appends evidence; it never rewrites the original audit record.</p>
    {error ? <p className="text-red-200">{error}</p> : null}
  </section>;
}