"use client";

import { useState } from "react";
import { normalizeTimelineDawMidiHelpStep, TIMELINE_DAW_MIDI_HELP_STEPS, timelineDawMidiHelpStorageKey } from "@/lib/timeline/TimelineDawMidiHelpPolicy";

export default function TimelineDawMidiBabyStepHelp({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(() => { try { return typeof window === "undefined" ? 0 : normalizeTimelineDawMidiHelpStep(window.localStorage.getItem(timelineDawMidiHelpStorageKey(sessionId))); } catch { return 0; } });
  const move = (next: number) => { const normalized = normalizeTimelineDawMidiHelpStep(next); setStep(normalized); try { window.localStorage.setItem(timelineDawMidiHelpStorageKey(sessionId), String(normalized)); } catch {} };
  const current = TIMELINE_DAW_MIDI_HELP_STEPS[step];
  return <div className="mt-3 rounded-xl border border-fuchsia-200/20 bg-black/25 p-3">
    <button type="button" className="font-black text-fuchsia-100" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? "▼" : "▶"} How do I create and edit MIDI?</button>
    {open ? <div className="mt-3"><p className="text-[11px] font-black uppercase tracking-wider text-fuchsia-200">Step {step + 1} of {TIMELINE_DAW_MIDI_HELP_STEPS.length}</p><p className="mt-1 text-base font-black">{current.title}</p><p className="mt-1 text-sm text-white/70">{current.instruction}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-white/25 bg-white px-3 py-2 font-black text-black disabled:opacity-40" disabled={step === 0} onClick={() => move(step - 1)}>Previous Step</button><button type="button" className="rounded-lg border border-white/25 bg-white px-3 py-2 font-black text-black disabled:opacity-40" disabled={step === TIMELINE_DAW_MIDI_HELP_STEPS.length - 1} onClick={() => move(step + 1)}>Next Step</button><button type="button" className="rounded-lg border border-white/25 px-3 py-2 font-black" onClick={() => move(0)}>Start Over</button></div><p className="mt-2 text-xs text-white/50">Only this help-step number is remembered for this protected session. MIDI, audio, device names, and settings are not stored by the guide.</p></div> : null}
  </div>;
}
