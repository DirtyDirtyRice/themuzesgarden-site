"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import TimelineDawBetaCollaboratorPanel from "@/app/components/TimelineDawBetaCollaboratorPanel";
import TimelineDawBetaAuditionPlayer from "@/app/components/TimelineDawBetaAuditionPlayer";
import TimelineDawMusicianTrialWorkspace from "@/app/components/TimelineDawMusicianTrialWorkspace";
import { completeTimelineDawMusicianTrialStep, createTimelineDawMusicianTrialResultSummary, parseTimelineDawMusicianTrialProgress, summarizeTimelineDawMusicianTrialProgress, type TimelineDawMusicianTrialProgress, type TimelineDawMusicianTrialStepKey } from "@/lib/timeline/TimelineDawMusicianTrialProgress";

type AccessData = {
  access: { role: string; reason: string; receiptId: string };
  capabilities: string[];
  trialReadiness: { ready: boolean; completed: number; required: number; steps: Array<{ key: string; label: string; ready: boolean }> };
  receipts: Array<{ id: string; capability: string; allowed: boolean; observed_at: string }>;
};

export default function TimelineDawBetaSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const [sessionId, setSessionId] = useState("");
  const [data, setData] = useState<AccessData | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<TimelineDawMusicianTrialProgress>({});
  const [copyMessage, setCopyMessage] = useState("");
  const completeStep = useCallback((key: TimelineDawMusicianTrialStepKey) => { if (!sessionId) return; setProgress((current) => { const next = completeTimelineDawMusicianTrialStep(current, key, new Date().toISOString()); try { localStorage.setItem(`muzes-daw-musician-trial-progress:${sessionId}`, JSON.stringify(next)); } catch { /* Progress display remains available for this visit. */ } return next; }); }, [sessionId]);
  const progressSummary = useMemo(() => summarizeTimelineDawMusicianTrialProgress(progress), [progress]);
  async function copyResults() { try { await navigator.clipboard.writeText(createTimelineDawMusicianTrialResultSummary(progress)); setCopyMessage("Trial results copied. Paste them into your message to the owner."); } catch { setCopyMessage("Copy was blocked. Please allow clipboard access and try again."); } }
  useEffect(() => { void params.then(async (value) => {
    setSessionId(value.sessionId);
    try {
      const token = (await requireProjectSupabase().auth.getSession()).data.session?.access_token ?? "";
      const response = await fetch(`/api/timeline/daw-session-access?sessionId=${encodeURIComponent(value.sessionId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Session access could not be verified."); }
  }); }, [params]);
  useEffect(() => { if (!sessionId) return; try { setProgress(parseTimelineDawMusicianTrialProgress(JSON.parse(localStorage.getItem(`muzes-daw-musician-trial-progress:${sessionId}`) ?? "{}"))); } catch { setProgress({}); } }, [sessionId]);
  useEffect(() => { if (data) completeStep("access"); }, [completeStep, data]);
  return <main className="mx-auto max-w-4xl space-y-5 p-6 text-white">
    <p className="text-xs font-black uppercase tracking-[.22em] text-sky-200">Controlled musician beta</p>
    <h1 className="text-4xl font-black">Musician Test Session</h1>
    <p className="text-white/60">Every opening is checked against your invitation, setup check, owner release, and current permission.</p>
    {error ? <section className="rounded-2xl border border-amber-300/30 p-4"><h2 className="font-black">Session remains locked</h2><p>{error}</p><Link className="mt-3 inline-block rounded-lg bg-white px-3 py-2 font-black text-black" href="/workspace/daw/beta">Return to enrollment</Link></section> : null}
    {data ? <>
      <section className="rounded-2xl border border-emerald-300/30 bg-emerald-300/[.05] p-4"><h2 className="text-2xl font-black">Access verified</h2><p>{data.access.role} · {data.access.reason}</p><p className="text-xs text-white/45">Session {sessionId} · receipt {data.access.receiptId}</p></section>
      <section className={`rounded-2xl border p-4 ${data.trialReadiness.ready ? "border-emerald-300/30" : "border-amber-300/40 bg-amber-300/[.06]"}`}>
        <h2 className="text-2xl font-black">Hands-on DAW trial: {data.trialReadiness.ready ? "ready" : "not ready"}</h2>
        <p className="mt-1 text-white/70">{data.trialReadiness.completed}/{data.trialReadiness.required} essential musician steps are available.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{data.trialReadiness.steps.map((step) => <p className={step.ready ? "text-emerald-200" : "text-amber-200"} key={step.key}>{step.ready ? "Ready" : "Blocked"} · {step.label}</p>)}</div>
        {!data.trialReadiness.ready ? <p className="mt-3 font-bold text-amber-100">This page currently supports listening and feedback only. It is not yet a complete hands-on DAW trial.</p> : null}
      </section>
      <section className={`rounded-2xl border p-4 ${progressSummary.complete ? "border-emerald-300/40 bg-emerald-300/[.06]" : "border-sky-300/30"}`}><h2 className="text-2xl font-black">Your trial checklist: {progressSummary.completed}/{progressSummary.required}</h2><p className="mt-1 text-white/65">Complete these in order if that feels natural. The checkmarks stay in this browser and contain no audio or private project data.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{progressSummary.steps.map((step) => <p className={step.complete ? "text-emerald-200" : "text-white/65"} key={step.key}>{step.complete ? "✓ Done" : "○ Try next"} · {step.label}</p>)}</div>{progressSummary.complete ? <p className="mt-3 font-black text-emerald-200">All seven musician actions completed. Tell the owner what felt difficult or unclear.</p> : null}<button className="mt-3 rounded-lg bg-white px-3 py-2 font-black text-black" onClick={() => void copyResults()}>Copy Results for Owner</button>{copyMessage ? <p className="mt-2 text-sky-200">{copyMessage}</p> : null}</section>
      <section className="rounded-2xl border border-white/15 p-4"><h2 className="font-black">Current permissions</h2>{data.capabilities.map((item) => <p key={item}>✓ {item}</p>)}<p className="mt-3 text-sm text-white/55">Administration, invitations, release decisions, destructive restore, delivery, and project privacy remain owner-only.</p></section>
      <TimelineDawBetaAuditionPlayer sessionId={sessionId} onPlayed={() => completeStep("play")}/>
      <TimelineDawMusicianTrialWorkspace sessionId={sessionId} onStepComplete={completeStep}/>
      <TimelineDawBetaCollaboratorPanel sessionId={sessionId} onFeedbackSubmitted={() => completeStep("feedback")}/>
    </> : null}
  </main>;
}
