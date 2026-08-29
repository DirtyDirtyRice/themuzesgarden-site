"use client";

import { useState } from "react";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  summarizeTimelineDawVerbalEditRequest,
  TIMELINE_DAW_VERBAL_EDIT_SCOPES,
  type TimelineDawVerbalEditRequest,
} from "@/lib/timeline/TimelineDawVerbalEditRequestPolicy";

const fieldClass = "w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white outline-none focus:border-fuchsia-300";
const buttonClass = "rounded-xl border border-fuchsia-200/40 bg-fuchsia-200 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function TimelineDawVerbalEditWorkspace() {
  const [instruction, setInstruction] = useState("");
  const [scope, setScope] = useState<TimelineDawVerbalEditRequest["scope"]>("whole-song");
  const [heldRequest, setHeldRequest] = useState<TimelineDawVerbalEditRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  function holdRequest() {
    try {
      setHeldRequest(parseTimelineDawVerbalEditRequest({ instruction, scope, preserveSources: true }));
      setError(null);
    } catch (cause) {
      setHeldRequest(null);
      setError(cause instanceof Error ? cause.message : "The edit request could not be prepared.");
    }
  }

  const summary = heldRequest ? summarizeTimelineDawVerbalEditRequest(heldRequest) : null;
  const plan = heldRequest ? createTimelineDawProtectedEditPlan(heldRequest) : null;

  return (
    <section aria-labelledby="verbal-editing-heading" className="rounded-3xl border border-fuchsia-300/25 bg-fuchsia-300/[0.05] p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-200">Verbal Editing · protected request</p>
      <h2 id="verbal-editing-heading" className="mt-2 text-2xl font-black">Tell the DAW what you want changed</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/65">
        Describe the musical result in ordinary words. This first step only prepares your request for review. It does not contact AI, change audio, or save your private words in browser storage.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <label className="text-sm font-bold">
          What part of the music?
          <select className={`${fieldClass} mt-2`} value={scope} onChange={(event) => setScope(event.target.value as TimelineDawVerbalEditRequest["scope"])}>
            {TIMELINE_DAW_VERBAL_EDIT_SCOPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">
          Describe the edit
          <textarea
            className={`${fieldClass} mt-2 min-h-32 resize-y`}
            maxLength={4_000}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Example: Keep my main riff under every verse, make the drums funky R&B, and leave my vocal melody unchanged."
          />
          <span className="mt-1 block text-right text-xs font-normal text-white/45">{instruction.length}/4,000</span>
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4 text-sm">
        <p className="font-black text-emerald-200">Source protection is on</p>
        <p className="mt-1 text-white/60">Verbal Editing must make a reviewable plan before any future edit. Original recordings and approved work remain untouched.</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={holdRequest}>Prepare Request for Review</button>
        <button type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-black disabled:opacity-40" disabled={!instruction && !heldRequest} onClick={() => { setInstruction(""); setHeldRequest(null); setError(null); }}>Clear Request</button>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-100">{error}</p> : null}
      {summary ? (
        <article className="mt-5 rounded-2xl border border-fuchsia-200/25 bg-black/40 p-4" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-wider text-fuchsia-200">Request held for the next planning step</p>
          <p className="mt-3 text-sm"><b>Scope:</b> {summary.scopeLabel}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{summary.instruction}</p>
          <p className="mt-3 text-xs font-bold text-emerald-200">{summary.safetyLabel}</p>
        </article>
      ) : null}
      {plan ? (
        <article className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-200/[0.06] p-4" aria-labelledby="protected-edit-plan-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-200">Protected AI edit plan</p>
              <h3 id="protected-edit-plan-heading" className="mt-1 text-xl font-black">Held for your review</h3>
            </div>
            <span className="rounded-full border border-amber-200/30 px-3 py-1 text-xs font-black uppercase text-amber-100">Music unchanged</span>
          </div>
          <p className="mt-3 text-sm"><b>Target:</b> {plan.target}</p>
          <ol className="mt-4 space-y-2 text-sm text-white/75">
            {plan.steps.map((step, index) => <li key={step} className="flex gap-3"><span className="font-black text-amber-200">{index + 1}.</span><span>{step}</span></li>)}
          </ol>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-white/50">Question to resolve before execution</p>
            {plan.questions.map((question) => <p key={question} className="mt-2 text-sm">{question}</p>)}
          </div>
          <ul className="mt-4 space-y-1 text-xs font-bold text-emerald-200">
            {plan.protections.map((protection) => <li key={protection}>✓ {protection}</li>)}
          </ul>
          <button type="button" className={`${buttonClass} mt-4`} disabled={!plan.executionAllowed}>Apply Edit</button>
          <p className="mt-2 text-xs text-white/50">Apply Edit is intentionally locked. Approval, rejection, revision, and explanation are the next separate milestone.</p>
        </article>
      ) : null}
    </section>
  );
}
