"use client";

import { useState } from "react";
import { normalizeTimelineDawRecoveryHelpStep, TIMELINE_DAW_RECOVERY_HELP_STEPS, timelineDawRecoveryHelpStorageKey } from "@/lib/timeline/TimelineDawRecoveryHelpPolicy";

export default function TimelineDawRecoveryBabyStepHelp({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(() => { try { return typeof window === "undefined" ? 0 : normalizeTimelineDawRecoveryHelpStep(window.localStorage.getItem(timelineDawRecoveryHelpStorageKey(sessionId))); } catch { return 0; } });
  const move = (next: number) => { const normalized = normalizeTimelineDawRecoveryHelpStep(next); setStep(normalized); try { window.localStorage.setItem(timelineDawRecoveryHelpStorageKey(sessionId), String(normalized)); } catch {} };
  const current = TIMELINE_DAW_RECOVERY_HELP_STEPS[step];
  return <div className="mb-4 rounded-xl border border-amber-200/25 bg-amber-300/[0.06] p-3">
    <button type="button" className="font-black text-amber-100" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "▼" : "▶"} How do I save or recover my work?</button>
    {open ? <div className="mt-3"><p className="text-[11px] font-black uppercase tracking-wider text-amber-200">Step {step + 1} of {TIMELINE_DAW_RECOVERY_HELP_STEPS.length}</p><p className="mt-1 text-base font-black">{current.title}</p><p className="mt-1 text-sm text-white/70">{current.instruction}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-white/25 bg-white px-3 py-2 font-black text-black disabled:opacity-40" disabled={step === 0} onClick={() => move(step - 1)}>Previous Step</button><button type="button" className="rounded-lg border border-white/25 bg-white px-3 py-2 font-black text-black disabled:opacity-40" disabled={step === TIMELINE_DAW_RECOVERY_HELP_STEPS.length - 1} onClick={() => move(step + 1)}>Next Step</button><button type="button" className="rounded-lg border border-white/25 px-3 py-2 font-black" onClick={() => move(0)}>Start Over</button></div><p className="mt-2 text-xs text-white/50">Only this guide&apos;s step number is remembered for this protected session. Audio, filenames, checkpoint names, device details, and private notes are never stored by the guide.</p></div> : null}
  </div>;
}
