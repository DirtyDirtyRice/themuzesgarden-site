"use client";

import { useEffect, useState } from "react";
import { normalizeTimelineDawExportHelpStep, timelineDawExportHelpStorageKey, TIMELINE_DAW_EXPORT_HELP_STEPS } from "@/lib/timeline/TimelineDawExportHelpPolicy";

const control = "rounded-lg border border-sky-200/30 px-3 py-1.5 text-xs font-black text-sky-100 disabled:opacity-35";

export default function ProjectDawExportHelp({ sessionId }: { sessionId: string }) {
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try { setStep(normalizeTimelineDawExportHelpStep(localStorage.getItem(timelineDawExportHelpStorageKey(sessionId)))); } catch { setStep(0); }
      setLoaded(true);
    });
    return () => { active = false; };
  }, [sessionId]);
  function choose(next: number) {
    const normalized = normalizeTimelineDawExportHelpStep(next);
    setStep(normalized);
    try { localStorage.setItem(timelineDawExportHelpStorageKey(sessionId), String(normalized)); } catch { /* Help remains usable without browser storage. */ }
  }
  const current = TIMELINE_DAW_EXPORT_HELP_STEPS[step];
  return <details className="mt-4 rounded-2xl border border-sky-300/30 bg-sky-300/[.05] p-4">
    <summary className="cursor-pointer font-black text-sky-100">How do I export and verify my download?</summary>
    <div className="mt-3" aria-live="polite">
      <p className="text-xs font-black uppercase tracking-wider text-sky-200">One action at a time · Step {step + 1} of {TIMELINE_DAW_EXPORT_HELP_STEPS.length}</p>
      <h3 className="mt-1 text-lg font-black">{current.title}</h3>
      <p className="mt-1 text-sm text-white/70">{current.instruction}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={control} disabled={!loaded || step === 0} onClick={() => choose(step - 1)}>Previous Step</button>
        <button type="button" className={control} disabled={!loaded || step === TIMELINE_DAW_EXPORT_HELP_STEPS.length - 1} onClick={() => choose(step + 1)}>Next Step</button>
        {step > 0 ? <button type="button" className={control} disabled={!loaded} onClick={() => choose(0)}>Start Over</button> : null}
      </div>
      <p className="mt-2 text-xs text-white/40">This session remembers only the current help-step number. No song, audio, receipt, or private note is stored here.</p>
    </div>
  </details>;
}
