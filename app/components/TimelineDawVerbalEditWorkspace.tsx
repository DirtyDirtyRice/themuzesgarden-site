"use client";

import { useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  decideTimelineDawVerbalEditPlan,
  createTimelineDawVerbalRevisionHistory,
  moveTimelineDawVerbalRevisionHistory,
  recognizeTimelineDawVerbalSections,
  summarizeTimelineDawVerbalEditRequest,
  TIMELINE_DAW_VERBAL_EDIT_SCOPES,
  type TimelineDawVerbalEditRequest,
  type TimelineDawVerbalPlanDecision,
  type TimelineDawVerbalRevisionHistory,
  type TimelineDawVerbalNamedSection,
} from "@/lib/timeline/TimelineDawVerbalEditRequestPolicy";

const fieldClass = "w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white outline-none focus:border-fuchsia-300";
const buttonClass = "rounded-xl border border-fuchsia-200/40 bg-fuchsia-200 px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function TimelineDawVerbalEditWorkspace({ sessionId }: { sessionId: string }) {
  const [instruction, setInstruction] = useState("");
  const [scope, setScope] = useState<TimelineDawVerbalEditRequest["scope"]>("whole-song");
  const [heldRequest, setHeldRequest] = useState<TimelineDawVerbalEditRequest | null>(null);
  const [decisionExplanation, setDecisionExplanation] = useState("");
  const [planDecision, setPlanDecision] = useState<TimelineDawVerbalPlanDecision | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<TimelineDawVerbalRevisionHistory | null>(null);
  const [namedSections, setNamedSections] = useState<TimelineDawVerbalNamedSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSections() {
      try {
        const { data } = await requireProjectSupabase().auth.getSession();
        const response = await fetch(`/api/timeline/daw-arrangement-items?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Named sections could not be loaded.");
        if (active) setNamedSections((body.items ?? []).filter((item: { kind?: string; endTick?: number | null }) => item.kind === "section" && item.endTick !== null).map((item: { id: string; name: string; startTick: number; endTick: number }) => ({ id: item.id, name: item.name, startTick: item.startTick, endTick: item.endTick })));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Named sections could not be loaded.");
      } finally {
        if (active) setSectionsLoading(false);
      }
    }
    void loadSections();
    return () => { active = false; };
  }, [sessionId]);

  function holdRequest() {
    try {
      setHeldRequest(parseTimelineDawVerbalEditRequest({ instruction, scope, preserveSources: true }));
      setPlanDecision(null);
      setRevisionHistory(null);
      setSelectedSectionId(null);
      setDecisionExplanation("");
      setError(null);
    } catch (cause) {
      setHeldRequest(null);
      setError(cause instanceof Error ? cause.message : "The edit request could not be prepared.");
    }
  }

  const summary = heldRequest ? summarizeTimelineDawVerbalEditRequest(heldRequest) : null;
  const plan = heldRequest ? createTimelineDawProtectedEditPlan(heldRequest) : null;
  const sectionRecognition = heldRequest ? recognizeTimelineDawVerbalSections({ instruction: heldRequest.instruction, sections: namedSections, selectedSectionId }) : null;

  function decidePlan(decision: TimelineDawVerbalPlanDecision["status"]) {
    try {
      setPlanDecision(decideTimelineDawVerbalEditPlan({ decision, explanation: decisionExplanation }));
      setRevisionHistory(null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The plan decision could not be recorded.");
    }
  }

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
        <button type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-black disabled:opacity-40" disabled={!instruction && !heldRequest} onClick={() => { setInstruction(""); setHeldRequest(null); setPlanDecision(null); setRevisionHistory(null); setSelectedSectionId(null); setDecisionExplanation(""); setError(null); }}>Clear Request</button>
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
      {sectionRecognition && heldRequest?.scope === "section" ? (
        <article className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.05] p-4" aria-labelledby="verbal-section-heading">
          <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Song-section recognition</p>
          <h3 id="verbal-section-heading" className="mt-1 text-lg font-black">Confirm the named section</h3>
          {sectionsLoading ? <p className="mt-3 text-sm text-white/60">Loading this session’s named arrangement sections…</p> : namedSections.length === 0 ? <p className="mt-3 text-sm text-amber-100">No saved arrangement sections are available yet. Name sections in Tracks, Editing, and MIDI before targeting one verbally.</p> : (
            <>
              <p className="mt-2 text-sm text-white/65">{sectionRecognition.confidence === "exact" ? "One named section was recognized. Confirm it below." : sectionRecognition.confidence === "ambiguous" ? "More than one named section was mentioned. Choose the exact target." : "No exact saved section name was recognized. Choose the intended target."}</p>
              <label className="mt-3 block text-sm font-bold">Named section
                <select className={`${fieldClass} mt-2`} value={sectionRecognition.selectedSectionId ?? ""} onChange={(event) => setSelectedSectionId(event.target.value || null)}>
                  <option value="">Choose a named section…</option>
                  {sectionRecognition.sections.map((section) => <option key={section.id} value={section.id}>{section.name} · ticks {section.startTick}–{section.endTick}</option>)}
                </select>
              </label>
              {sectionRecognition.selectedSectionId ? <p className="mt-3 text-xs font-bold text-emerald-200">Target confirmed: {sectionRecognition.sections.find((section) => section.id === sectionRecognition.selectedSectionId)?.name}. Music remains unchanged.</p> : <p className="mt-3 text-xs font-bold text-amber-100">A named section must be confirmed before a later section edit can execute.</p>}
            </>
          )}
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
          <label className="mt-5 block text-sm font-bold">
            Explain a rejection or requested revision
            <textarea className={`${fieldClass} mt-2 min-h-24 resize-y`} maxLength={2_000} value={decisionExplanation} onChange={(event) => setDecisionExplanation(event.target.value)} placeholder="Example: Use only the second chorus, and keep the original guitar tone." />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => decidePlan("approved")}>Approve Plan</button>
            <button type="button" className="rounded-xl border border-amber-200/40 px-4 py-3 text-sm font-black text-amber-100" onClick={() => decidePlan("revision-requested")}>Request Revision</button>
            <button type="button" className="rounded-xl border border-red-300/40 px-4 py-3 text-sm font-black text-red-100" onClick={() => decidePlan("rejected")}>Reject Plan</button>
          </div>
          {planDecision ? <div className="mt-4 rounded-xl border border-white/15 bg-black/40 p-3" aria-live="polite"><p className="font-black uppercase text-fuchsia-200">{planDecision.status.replace("-", " ")}</p><p className="mt-1 text-sm text-white/70">{planDecision.explanation}</p><p className="mt-2 text-xs font-bold text-emerald-200">Music remains unchanged. This decision cannot execute the edit.</p></div> : null}
          {planDecision?.status === "approved" && heldRequest ? (
            <div className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4">
              <p className="font-black text-emerald-200">Nondestructive draft protection</p>
              <p className="mt-1 text-sm text-white/65">Create a separate draft with a locked original underneath it. This prepares revision safety only; it does not render or alter audio.</p>
              {!revisionHistory ? <button type="button" className={`${buttonClass} mt-3`} onClick={() => setRevisionHistory(createTimelineDawVerbalRevisionHistory({ request: heldRequest, decision: planDecision }))}>Create Protected Draft</button> : (
                <div className="mt-3" aria-live="polite">
                  <p className="text-sm"><b>Now previewing:</b> {revisionHistory.revisions[revisionHistory.activeIndex]?.label}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-200">Original source locked · {revisionHistory.revisions.length} recoverable revisions</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className={buttonClass} disabled={revisionHistory.activeIndex === 0} onClick={() => setRevisionHistory(moveTimelineDawVerbalRevisionHistory(revisionHistory, "undo"))}>Undo to Original</button>
                    <button type="button" className={buttonClass} disabled={revisionHistory.activeIndex === revisionHistory.revisions.length - 1} onClick={() => setRevisionHistory(moveTimelineDawVerbalRevisionHistory(revisionHistory, "redo"))}>Redo Draft</button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <button type="button" className={`${buttonClass} mt-4`} disabled={!plan.executionAllowed}>Apply Edit</button>
          <p className="mt-2 text-xs text-white/50">Apply Edit remains intentionally locked even after plan approval. Nondestructive execution and undo are separate protected milestones.</p>
        </article>
      ) : null}
    </section>
  );
}
