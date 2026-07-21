"use client";

import { useEffect, useState } from "react";

import type { VerificationJob } from "@/lib/developer-workspace/verificationCoordinator";

type Status = { active: VerificationJob | null; queued: VerificationJob[]; history: VerificationJob[] };

export default function VerificationQueuePanel() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    let active = true;
    async function poll() {
      try { const response = await fetch("/api/developer-workspace/verification", { cache: "no-store" }); if (active && response.ok) setStatus(await response.json() as Status); }
      finally { if (active) window.setTimeout(() => void poll(), 1_500); }
    }
    void poll(); return () => { active = false; };
  }, []);

  return <div className="mt-4 rounded-lg border border-teal-300/20 bg-teal-300/5 p-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[0.2em] text-teal-200">Verification coordinator</div><div className="mt-1 text-sm text-white/55">One compiler or build worker at a time. Safe patches wait their turn automatically.</div></div><div className="flex gap-2 text-xs"><span className="rounded border border-white/10 px-2 py-1">{status?.active ? `Running ${status.active.kind}` : "Idle"}</span><span className="rounded border border-white/10 px-2 py-1">{status?.queued.length ?? 0} queued</span></div></div>
    {status?.history.length ? <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-teal-100/70">Recent verification history · saved locally</summary><div className="mt-2 space-y-1">{status.history.slice(0, 8).map((job) => <div key={job.id} className="flex flex-wrap justify-between gap-2 rounded bg-black/20 px-2 py-1 text-xs"><span>{job.kind} · {job.source}</span><span className={job.status === "passed" ? "text-emerald-200" : "text-red-200"}>{job.status}</span></div>)}</div></details> : null}
  </div>;
}
