"use client";

import { useMemo, useState } from "react";
import { assessTimelineDawMixingProductionQa, TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS, TIMELINE_DAW_MIXING_PRODUCTION_QA_LABELS, type TimelineDawMixingProductionQaCheck } from "@/lib/timeline/TimelineDawMixingProductionQaPolicy";

const field = "rounded-lg border border-white/20 bg-black px-3 py-2 text-white";

export default function TimelineDawMixingProductionQaWorkspace() {
  const [bridgeName, setBridgeName] = useState("");
  const [pluginIdentity, setPluginIdentity] = useState("");
  const [controlSurfaceName, setControlSurfaceName] = useState("");
  const [evidence, setEvidence] = useState<Partial<Record<TimelineDawMixingProductionQaCheck, "pass" | "issue">>>({});
  const report = useMemo(() => assessTimelineDawMixingProductionQa({ bridgeName, pluginIdentity, controlSurfaceName, evidence }), [bridgeName, pluginIdentity, controlSurfaceName, evidence]);
  const statusLabel = report.status === "passed" ? "PRODUCTION EVIDENCE COMPLETE" : report.status === "needs-review" ? "HELD FOR REVIEW" : report.status === "equipment-required" ? "REAL EQUIPMENT REQUIRED" : "QUALIFICATION IN PROGRESS";

  return <section className="mt-5 rounded-3xl border border-cyan-300/25 bg-cyan-300/[0.05] p-5">
    <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Professional mixing production QA</p>
    <h2 className="mt-1 text-2xl font-black">Pro Tools/Ableton-class evidence gate</h2>
    <p className="mt-2 text-sm text-white/60">This current-tab checklist records musician-confirmed trials with real equipment. Software readiness alone cannot pass it, and no private audio, plug-in state, or device settings are stored.</p>
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <label className="text-sm font-black">Desktop bridge name and version<input className={`${field} mt-1 block w-full`} value={bridgeName} onChange={(event) => setBridgeName(event.target.value)} placeholder="Required real bridge" /></label>
      <label className="text-sm font-black">Plug-in name, format, and version<input className={`${field} mt-1 block w-full`} value={pluginIdentity} onChange={(event) => setPluginIdentity(event.target.value)} placeholder="Required real plug-in" /></label>
      <label className="text-sm font-black">Control-surface name<input className={`${field} mt-1 block w-full`} value={controlSurfaceName} onChange={(event) => setControlSurfaceName(event.target.value)} placeholder="Required physical controller" /></label>
    </div>
    <div className="mt-4 space-y-2">{TIMELINE_DAW_MIXING_PRODUCTION_QA_CHECKS.map((check, index) => <div key={check} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_auto_auto]"><p className="text-sm"><span className="font-black">{index + 1}. </span>{TIMELINE_DAW_MIXING_PRODUCTION_QA_LABELS[check]}</p><button type="button" className={`rounded-lg border px-3 py-1 text-xs font-black ${evidence[check] === "pass" ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/25"}`} onClick={() => setEvidence((current) => ({ ...current, [check]: "pass" }))}>REAL TEST PASSED</button><button type="button" className={`rounded-lg border px-3 py-1 text-xs font-black ${evidence[check] === "issue" ? "border-rose-300 bg-rose-300 text-black" : "border-white/25"}`} onClick={() => setEvidence((current) => ({ ...current, [check]: "issue" }))}>ISSUE FOUND</button></div>)}</div>
    <div className={`mt-4 rounded-xl border p-4 ${report.status === "passed" ? "border-emerald-300/40 text-emerald-100" : report.status === "needs-review" ? "border-rose-300/40 text-rose-100" : "border-amber-300/40 text-amber-100"}`}><p className="font-black">{statusLabel}</p><p className="mt-1 text-sm">{report.passedChecks.length}/12 checks passed · {report.remainingChecks.length} remaining · {report.issues.length} issues</p>{report.status === "equipment-required" ? <p className="mt-2 text-sm">Enter the exact real bridge, plug-in, and control-surface identities before this report can qualify production behavior.</p> : null}{report.status === "needs-review" ? <p className="mt-2 text-sm">Resolve every reported issue and repeat the affected real-world trial. A later pass replaces the issue for that check.</p> : null}{report.status === "passed" ? <p className="mt-2 text-sm">All named real equipment and all twelve musician-confirmed production trials passed in this tab.</p> : null}</div>
  </section>;
}
