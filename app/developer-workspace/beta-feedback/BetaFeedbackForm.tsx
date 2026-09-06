"use client";

import { useEffect, useState } from "react";

const storageKey = "developer-workspace-beta-feedback-v1";

type Feedback = {
  coderRole: string; projectStage: string; projectSize: string; operatingSystem: string;
  completedScenario: string; clarity: string; usefulness: string; confidence: string;
  workedWell: string; confusing: string; missing: string; improvement: string; unexpected: string;
};

const empty: Feedback = { coderRole: "", projectStage: "", projectSize: "", operatingSystem: "", completedScenario: "", clarity: "", usefulness: "", confidence: "", workedWell: "", confusing: "", missing: "", improvement: "", unexpected: "" };

export default function BetaFeedbackForm() {
  const [feedback, setFeedback] = useState<Feedback>(empty);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setFeedback({ ...empty, ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") }); } catch {}
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(storageKey, JSON.stringify(feedback)); }, [feedback, loaded]);
  function update<K extends keyof Feedback>(key: K, value: Feedback[K]) { setFeedback((current) => ({ ...current, [key]: value })); }
  function download() {
    const safeReport = { product: "Developer Workspace Beta", version: 1, recordedAt: new Date().toISOString(), ...feedback, privacyReminder: "No source code, credentials, environment variables, or absolute paths should be included." };
    const url = URL.createObjectURL(new Blob([JSON.stringify(safeReport, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `developer-workspace-beta-feedback-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  }
  const input = "mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-white outline-none focus:border-amber-300/60";
  return <section className="rounded-xl border border-amber-300/25 bg-[#0b1720] p-5">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(["coderRole", "projectStage", "projectSize", "operatingSystem"] as const).map((key) => <label key={key} className="text-sm font-black capitalize">{key.replace(/([A-Z])/g, " $1")}<input className={input} value={feedback[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
      <label className="text-sm font-black">Scenario completed<select className={input} value={feedback.completedScenario} onChange={(event) => update("completedScenario", event.target.value)}><option value="">Choose one</option><option>Beginning of a project</option><option>Middle of an existing project</option><option>Both scenarios</option></select></label>
      {(["clarity", "usefulness", "confidence"] as const).map((key) => <label key={key} className="text-sm font-black capitalize">{key} (1–5)<select className={input} value={feedback[key]} onChange={(event) => update(key, event.target.value)}><option value="">Not rated</option>{[1,2,3,4,5].map((value) => <option key={value}>{value}</option>)}</select></label>)}
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {([['workedWell','What worked well?'],['confusing','What was confusing?'],['missing','What was missing?'],['improvement','What would make this better?'],['unexpected','What behaved unexpectedly?']] as const).map(([key, label]) => <label key={key} className="text-sm font-black">{label}<textarea className={`${input} min-h-32`} value={feedback[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
    </div>
    <p className="mt-4 text-xs leading-5 text-white/45">This draft stays in this browser. Do not paste source code, credentials, environment variables, client names, or private absolute paths.</p>
    <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={download} className="rounded-lg border border-amber-300/45 px-4 py-2 font-black text-amber-100">Download feedback report</button><button type="button" onClick={() => setFeedback(empty)} className="rounded-lg border border-white/15 px-4 py-2 font-bold text-white/65">Clear draft</button></div>
  </section>;
}
