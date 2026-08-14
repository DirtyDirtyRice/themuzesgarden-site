"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import type { TimelineDawReportObservation, TimelineDawReportFindingStatus } from "@/lib/timeline/TimelineDawOwnerTestReportPolicy";
import type { TimelineDawTechnicalTestResult } from "@/lib/timeline/TimelineDawTechnicalTestPolicy";

type Finding = {
  step: string;
  title: string;
  lessonId: string;
  anchor: string;
  status: TimelineDawReportFindingStatus;
  technical: TimelineDawTechnicalTestResult | null;
  human: TimelineDawReportObservation | null;
};
type Data = {
  session: { id: string; name: string; state: string };
  technicalReceipt: { receipt_checksum: string; created_at: string } | null;
  manualSession: { status: string; created_at: string; updated_at: string } | null;
  report: { generatedAt: string; privacy: string; findings: Finding[]; verifiedCount: number; humanRequiredCount: number; attentionRequiredCount: number; screenshotCount: number };
};

const button = "rounded-xl border border-white/20 bg-white px-4 py-2 font-black text-black disabled:opacity-40 print:hidden";
const styles: Record<TimelineDawReportFindingStatus, string> = {
  verified: "border-emerald-300/35 bg-emerald-300/10",
  "human-required": "border-sky-300/35 bg-sky-300/10",
  "attention-required": "border-amber-300/40 bg-amber-300/10",
};
const labels: Record<TimelineDawReportFindingStatus, string> = {
  verified: "Verified together",
  "human-required": "Human check needed",
  "attention-required": "Attention required",
};

export default function TimelineDawOwnerTestReport({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = (await requireProjectSupabase().auth.getSession()).data.session?.access_token;
    if (!token) throw new Error("Sign in again before opening the private test report.");
    const response = await fetch(`/api/timeline/daw-test-report?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Test report could not be loaded.");
    setData(result);
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => void load().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Test report could not be loaded."); }));
    return () => { active = false; };
  }, [load]);

  async function refresh() {
    setBusy(true); setError("");
    try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Test report could not be loaded."); }
    finally { setBusy(false); }
  }

  function download() {
    if (!data) return;
    const safe = { ...data, report: { ...data.report, findings: data.report.findings.map((finding) => ({ ...finding, human: finding.human ? { ...finding.human, screenshotDataUrl: undefined, screenshotIncluded: Boolean(finding.human.screenshotDataUrl) } : null })) } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `muzes-daw-test-report-${sessionId}.json`; link.click(); URL.revokeObjectURL(url);
  }

  function openLesson(lessonId: string) {
    window.dispatchEvent(new CustomEvent("muzes:daw-visual-lesson", { detail: { sessionId, lessonId } }));
    document.getElementById("timeline-daw-visual-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (    <section id="owner-test-report" className="rounded-3xl border-2 border-cyan-300/40 bg-cyan-300/[.05] p-5 print:fixed print:inset-0 print:z-[9999] print:overflow-visible print:bg-white print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[.22em] text-cyan-200 print:text-black">Private owner-musician evidence report</p><h2 className="mt-1 text-2xl font-black">Technical proof and human judgment</h2><p className="mt-1 max-w-3xl text-sm text-white/60 print:text-black">Machine evidence, listening decisions, usability notes, screenshots, and unresolved holds stay visibly separate.</p></div>
        <div className="flex flex-wrap gap-2"><button className={button} onClick={() => setOpen((value) => !value)}>{open ? "Close report" : "Open report"}</button><button className={button} disabled={busy} onClick={() => void refresh()}>{busy ? "Refreshing..." : "Refresh evidence"}</button>{data ? <><button className={button} onClick={() => window.print()}>Print private report</button><button className={button} onClick={download}>Download report JSON</button></> : null}</div>
      </div>
      {open && data ? <div className="mt-5">
        <div className="rounded-xl border border-white/15 p-4 print:border-black"><h3 className="text-xl font-black">{data.session.name}</h3><p className="text-sm">Generated {new Date(data.report.generatedAt).toLocaleString()} · Owner-only · Session {data.session.id}</p><p className="mt-1 text-xs break-all">Technical receipt: {data.technicalReceipt?.receipt_checksum ?? "No technical receipt yet — run technical checks first."}</p></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-emerald-300/30 p-3"><small>Verified together</small><p className="text-2xl font-black">{data.report.verifiedCount}</p></div><div className="rounded-xl border border-sky-300/30 p-3"><small>Human checks needed</small><p className="text-2xl font-black">{data.report.humanRequiredCount}</p></div><div className="rounded-xl border border-amber-300/30 p-3"><small>Attention required</small><p className="text-2xl font-black">{data.report.attentionRequiredCount}</p></div></div>
        <div className="mt-4 grid gap-3">{data.report.findings.map((finding) => <article key={finding.step} className={`rounded-xl border p-4 print:break-inside-avoid print:border-black ${styles[finding.status]}`}><div className="flex flex-wrap justify-between gap-2"><h3 className="text-lg font-black">{finding.title}</h3><strong>{labels[finding.status]}</strong></div><div className="mt-3 grid gap-3 md:grid-cols-2"><div className="rounded-lg border border-white/15 p-3 print:border-black"><p className="text-xs font-black uppercase">Automated technical proof</p>{finding.technical ? <><p className="mt-1 font-bold">{finding.technical.status}</p><p className="text-sm">{finding.technical.detail}</p>{finding.technical.evidenceCount !== null ? <small>Evidence count: {finding.technical.evidenceCount}</small> : null}</> : <p className="mt-1 text-sm">No saved technical receipt. Run technical checks first.</p>}</div><div className="rounded-lg border border-white/15 p-3 print:border-black"><p className="text-xs font-black uppercase">Musician observation</p>{finding.human ? <><p className="mt-1 font-bold">{finding.human.outcome}</p>{finding.human.notes ? <p className="text-sm">{finding.human.notes}</p> : null}<small>{new Date(finding.human.createdAt).toLocaleString()}{finding.human.clickCount !== null ? ` · ${finding.human.clickCount} clicks` : ""}{finding.human.excessiveSteps ? " · too many steps" : ""}</small>{finding.human.screenshotDataUrl ? <Image unoptimized width={640} height={360} className="mt-2 h-auto max-h-64 w-auto rounded border" src={finding.human.screenshotDataUrl} alt={`Private ${finding.title} test screenshot`} /> : null}</> : <p className="mt-1 text-sm">No human result has been recorded for this step.</p>}</div></div><div className="mt-3 flex gap-3 text-sm print:hidden"><button className="underline" onClick={() => openLesson(finding.lessonId)}>Open visual lesson</button><a className="underline" href={finding.anchor}>Open exact Studio control</a></div></article>)}</div>
        <p className="mt-4 text-xs text-white/50 print:text-black">Downloaded JSON omits embedded screenshot image data but records whether each private screenshot exists. Screenshots remain visible in this authenticated report and its printout.</p>
      </div> : null}
      {error ? <p role="alert" className="mt-3 rounded-xl border border-red-300/30 p-3 text-red-100 print:text-black">{error}</p> : null}
    </section>
  );
}
