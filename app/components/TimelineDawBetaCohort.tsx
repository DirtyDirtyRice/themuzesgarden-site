"use client";

import { useCallback, useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";

type Status = "invited" | "enrolled" | "released" | "actively-testing" | "blocked" | "completed";
type Tester = { enrollmentId: string; testerId: string; status: Status; acknowledged: boolean; environmentReady: boolean; released: boolean; allowedAccessCount: number; reportCount: number; unresolvedMajorOrBlocking: number; replyNeededCount: number; testAgainCount: number; completedTestAgainCount: number };
type Candidate = { id: string; ready: boolean; minimum_completed_testers: number; evaluation: { blockers: string[] }; receipt_checksum: string; observed_at: string };
type Data = { statuses: Record<Status, number>; testers: Tester[]; workflow: { percent: number; complete: boolean; exportReady: boolean }; unresolvedMajorOrBlocking: number; integrityBlockers: number; candidateReceipts: Candidate[]; evaluation?: { ready: boolean; blockers: string[] } };
const button = "rounded-lg border border-white/20 px-3 py-2 font-black disabled:opacity-40";
const labels: Record<Status, string> = { invited: "Invited", enrolled: "Enrolled", released: "Released", "actively-testing": "Testing", blocked: "Blocked", completed: "Completed" };

export default function TimelineDawBetaCohort({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null), [minimum, setMinimum] = useState(2), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useCallback(async (body?: Record<string, unknown>) => {
    const token = (await requireProjectSupabase().auth.getSession()).data.session?.access_token ?? "";
    const response = await fetch(body ? "/api/timeline/daw-beta-cohort" : `/api/timeline/daw-beta-cohort?sessionId=${encodeURIComponent(sessionId)}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify({ sessionId, ...body }) : undefined });
    const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result);
  }, [sessionId]);
  useEffect(() => { let active = true; queueMicrotask(() => void request().catch((cause) => { if (active) setError(cause.message); })); return () => { active = false; }; }, [request]);
  async function evaluate() { setBusy(true); setError(""); try { await request({ action: "evaluate", minimumCompletedTesters: minimum }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Release candidate evaluation failed."); } finally { setBusy(false); } }
  const latest = data?.candidateReceipts[0];
  return <section className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[.04] p-5">
    <p className="text-xs font-black uppercase tracking-[.22em] text-emerald-200">Beta cohort command center</p><h2 className="mt-1 text-2xl font-black">Tester progress and release candidate gate</h2>
    <p className="mt-2 text-sm text-white/55">This owner-only dashboard derives every status from saved enrollment, release, access, workflow, feedback, test-again, export, and integrity evidence.</p>
    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">{(Object.keys(labels) as Status[]).map((status) => <article className="rounded-xl border border-white/10 p-3" key={status}><p className="text-xs uppercase text-white/50">{labels[status]}</p><b className="text-2xl">{data?.statuses[status] ?? 0}</b></article>)}</div>
    <div className="mt-4 space-y-2">{data?.testers.map((tester) => <article className="rounded-xl border border-white/10 p-3" key={tester.enrollmentId}><div className="flex flex-wrap items-center justify-between gap-2"><b>Tester {tester.testerId.slice(0, 8)}</b><span className={`rounded-full border px-2 py-1 text-xs font-black uppercase ${tester.status === "blocked" ? "border-red-300/40 text-red-200" : tester.status === "completed" ? "border-emerald-300/40 text-emerald-200" : "border-sky-300/30 text-sky-200"}`}>{labels[tester.status]}</span></div><p className="mt-1 text-xs text-white/55">Acknowledged {tester.acknowledged ? "yes" : "no"} · environment {tester.environmentReady ? "ready" : "held"} · release {tester.released ? "passed" : "held"} · allowed access {tester.allowedAccessCount} · reports {tester.reportCount}</p><p className="text-xs text-white/55">Major/blocking open {tester.unresolvedMajorOrBlocking} · replies needed {tester.replyNeededCount} · test-again completed {tester.completedTestAgainCount}/{tester.testAgainCount}</p></article>)}</div>
    <div className="mt-4 rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-end gap-2"><label className="text-sm font-bold">Minimum completed testers<input className="mt-1 block w-28 rounded-lg border border-white/15 bg-black px-3 py-2" type="number" min={1} max={100} value={minimum} onChange={(event) => setMinimum(Number(event.target.value))}/></label><button className={button} disabled={busy || minimum < 1 || minimum > 100} onClick={() => void evaluate()}>{busy ? "Evaluating…" : "Evaluate release candidate"}</button></div><p className="mt-2 text-xs text-white/50">Workflow {data?.workflow.percent ?? 0}% · export {data?.workflow.exportReady ? "verified" : "held"} · major/blocking reports {data?.unresolvedMajorOrBlocking ?? 0} · integrity blockers {data?.integrityBlockers ?? 0}</p>
      {data?.evaluation ? <div className={`mt-2 ${data.evaluation.ready ? "text-emerald-200" : "text-amber-200"}`}><b>{data.evaluation.ready ? "Release candidate passed" : "Release candidate held"}</b>{data.evaluation.blockers.map((item) => <p key={item}>{item}</p>)}</div> : null}
      {latest ? <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/55"><b className={latest.ready ? "text-emerald-200" : "text-amber-200"}>Latest preserved receipt: {latest.ready ? "passed" : "held"}</b><p>{new Date(latest.observed_at).toLocaleString()} · minimum {latest.minimum_completed_testers} tester(s)</p>{latest.evaluation.blockers.map((item) => <p key={item}>{item}</p>)}<p className="break-all font-mono">{latest.receipt_checksum}</p></div> : null}
    </div>{error ? <p className="mt-3 text-red-200" role="alert">{error}</p> : null}
  </section>;
}
