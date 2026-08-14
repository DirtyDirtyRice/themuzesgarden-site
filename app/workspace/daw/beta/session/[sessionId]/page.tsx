"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import TimelineDawBetaCollaboratorPanel from "@/app/components/TimelineDawBetaCollaboratorPanel";
import TimelineDawBetaAuditionPlayer from "@/app/components/TimelineDawBetaAuditionPlayer";

type AccessData = { access: { role: string; reason: string; receiptId: string; observedAt: string }; capabilities: string[]; receipts: Array<{ id: string; capability: string; action: string; allowed: boolean; observed_at: string }> };
export default function TimelineDawBetaSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const [sessionId, setSessionId] = useState(""), [data, setData] = useState<AccessData | null>(null), [error, setError] = useState("");
  useEffect(() => { void params.then(async value => {
    setSessionId(value.sessionId);
    try {
      const token = (await requireProjectSupabase().auth.getSession()).data.session?.access_token ?? "";
      const response = await fetch(`/api/timeline/daw-session-access?sessionId=${encodeURIComponent(value.sessionId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); setData(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Session access could not be verified."); }
  }); }, [params]);
  return <main className="mx-auto max-w-4xl space-y-5 p-6 text-white"><p className="text-xs font-black uppercase tracking-[.22em] text-sky-200">Controlled musician beta</p><h1 className="text-4xl font-black">Collaborator Session Access</h1><p className="text-white/60">Every opening is checked against the live enrollment, acknowledgement, environment report, owner release gate, and revocation state.</p>{error?<section className="rounded-2xl border border-amber-300/30 p-4"><h2 className="font-black">Session remains locked</h2><p>{error}</p><Link className="mt-3 inline-block rounded-lg bg-white px-3 py-2 font-black text-black" href="/workspace/daw/beta">Return to enrollment</Link></section>:null}{data?<><section className="rounded-2xl border border-emerald-300/30 bg-emerald-300/[.05] p-4"><h2 className="text-2xl font-black">Access verified</h2><p>{data.access.role} · {data.access.reason}</p><p className="text-xs text-white/45">Session {sessionId} · receipt {data.access.receiptId}</p></section><section className="rounded-2xl border border-white/15 p-4"><h2 className="font-black">Granted capabilities</h2>{data.capabilities.map(item=><p key={item}>✓ {item}</p>)}<p className="mt-3 text-sm text-white/55">Administration, invitations, release decisions, destructive restore, export delivery, and project privacy remain owner-only.</p></section><section className="rounded-2xl border border-white/15 p-4"><h2 className="font-black">Access receipts</h2>{data.receipts.map(item=><p className="text-sm" key={item.id}>{item.allowed?"Allowed":"Denied"} · {item.capability} · {new Date(item.observed_at).toLocaleString()}</p>)}</section><TimelineDawBetaAuditionPlayer sessionId={sessionId}/><TimelineDawBetaCollaboratorPanel sessionId={sessionId}/></>:null}</main>;
}
