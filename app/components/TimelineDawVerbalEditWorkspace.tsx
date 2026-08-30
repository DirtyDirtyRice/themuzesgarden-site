"use client";

import { useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import { loadDawPrivateAudioLanes } from "@/app/workspace/projects/[id]/projectDawApi";
import {
  parseTimelineDawVerbalEditRequest,
  createTimelineDawProtectedEditPlan,
  decideTimelineDawVerbalEditPlan,
  createTimelineDawVerbalRevisionHistory,
  moveTimelineDawVerbalRevisionHistory,
  recognizeTimelineDawVerbalSections,
  createTimelineDawVerbalSectionRecipe,
  createTimelineDawGeneratedSectionPlan,
  createTimelineDawGeneratedTransitionPlan,
  matchTimelineDawTracksByDescription,
  createTimelineDawPerformanceLayerPlan,
  summarizeTimelineDawVerbalEditRequest,
  TIMELINE_DAW_VERBAL_EDIT_SCOPES,
  type TimelineDawVerbalEditRequest,
  type TimelineDawVerbalPlanDecision,
  type TimelineDawVerbalRevisionHistory,
  type TimelineDawVerbalNamedSection,
  type TimelineDawVerbalSectionOperation,
  type TimelineDawVerbalSectionRecipe,
  type TimelineDawGeneratedSectionPlan,
  type TimelineDawGeneratedTransitionPlan,
  type TimelineDawVerbalTrackCandidate,
  type TimelineDawVerbalPerformanceLayerPlan,
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
  const [sectionOperation, setSectionOperation] = useState<TimelineDawVerbalSectionOperation>("copy");
  const [destinationSectionId, setDestinationSectionId] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [sectionTicks, setSectionTicks] = useState(3840);
  const [sectionRecipe, setSectionRecipe] = useState<TimelineDawVerbalSectionRecipe | null>(null);
  const [generatedSectionType, setGeneratedSectionType] = useState<"verse" | "chorus" | "bridge">("verse");
  const [generatedBars, setGeneratedBars] = useState(8);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationPlan, setGenerationPlan] = useState<TimelineDawGeneratedSectionPlan | null>(null);
  const [transitionStyle, setTransitionStyle] = useState<TimelineDawGeneratedTransitionPlan["style"]>("clean-cut");
  const [transitionTicks, setTransitionTicks] = useState(240);
  const [tempoConfirmed, setTempoConfirmed] = useState(false);
  const [keyConfirmed, setKeyConfirmed] = useState(false);
  const [transitionPlan, setTransitionPlan] = useState<TimelineDawGeneratedTransitionPlan | null>(null);
  const [sessionTracks, setSessionTracks] = useState<TimelineDawVerbalTrackCandidate[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [performanceLayerPlan, setPerformanceLayerPlan] = useState<TimelineDawVerbalPerformanceLayerPlan | null>(null);
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

  useEffect(() => {
    let active = true;
    void loadDawPrivateAudioLanes(sessionId).then(({ lanes }) => {
      if (active) setSessionTracks(lanes.map((lane) => ({ id: lane.id, name: lane.name, kind: "audio" })));
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Session tracks could not be loaded."); });
    return () => { active = false; };
  }, [sessionId]);

  function holdRequest() {
    try {
      setHeldRequest(parseTimelineDawVerbalEditRequest({ instruction, scope, preserveSources: true }));
      setPlanDecision(null);
      setRevisionHistory(null);
      setSelectedSectionId(null);
      setSectionRecipe(null);
      setGenerationPlan(null);
      setTransitionPlan(null);
      setSelectedTrackId(null);
      setPerformanceLayerPlan(null);
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
  const trackSelection = heldRequest?.scope === "track" ? matchTimelineDawTracksByDescription({ description: heldRequest.instruction, tracks: sessionTracks, selectedTrackId }) : null;

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
        <button type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-black disabled:opacity-40" disabled={!instruction && !heldRequest} onClick={() => { setInstruction(""); setHeldRequest(null); setPlanDecision(null); setRevisionHistory(null); setSelectedSectionId(null); setSelectedTrackId(null); setPerformanceLayerPlan(null); setSectionRecipe(null); setGenerationPlan(null); setTransitionPlan(null); setDecisionExplanation(""); setError(null); }}>Clear Request</button>
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
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Complete-section recipe</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <label className="text-sm font-bold">Operation<select className={`${fieldClass} mt-1`} value={sectionOperation} onChange={(event) => { setSectionOperation(event.target.value as TimelineDawVerbalSectionOperation); setSectionRecipe(null); }}>{["add", "remove", "move", "copy", "extend"].map((operation) => <option key={operation} value={operation}>{operation[0].toUpperCase() + operation.slice(1)} complete section</option>)}</select></label>
                  {(sectionOperation === "move" || sectionOperation === "copy" || sectionOperation === "add") ? <label className="text-sm font-bold">Place after<select className={`${fieldClass} mt-1`} value={destinationSectionId} onChange={(event) => setDestinationSectionId(event.target.value)}><option value="">End of song</option>{sectionRecognition.sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label> : null}
                  {sectionOperation === "add" ? <label className="text-sm font-bold">New section name<input className={`${fieldClass} mt-1`} value={newSectionName} maxLength={120} onChange={(event) => setNewSectionName(event.target.value)} /></label> : null}
                  {(sectionOperation === "add" || sectionOperation === "extend") ? <label className="text-sm font-bold">Length in ticks<input className={`${fieldClass} mt-1`} type="number" min={1} step={1} value={sectionTicks} onChange={(event) => setSectionTicks(Number(event.target.value))} /></label> : null}
                </div>
                <button type="button" className={`${buttonClass} mt-3`} disabled={sectionOperation !== "add" && !sectionRecognition.selectedSectionId} onClick={() => { try { setSectionRecipe(createTimelineDawVerbalSectionRecipe({ operation: sectionOperation, sections: sectionRecognition.sections, sourceSectionId: sectionRecognition.selectedSectionId, destinationSectionId, addedName: newSectionName, durationTicks: sectionTicks })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Section recipe could not be prepared."); } }}>Preview Arrangement Recipe</button>
                {sectionRecipe ? <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3"><p className="font-black">Protected preview · {sectionRecipe.operation}</p><ol className="mt-2 flex flex-wrap gap-2 text-xs">{sectionRecipe.after.map((section, index) => <li key={`${section.id}-${index}`} className="rounded-lg border border-white/15 px-2 py-1">{index + 1}. {section.name} · {section.startTick}–{section.endTick}{section.sourceSectionId ? " · source preserved" : " · new placeholder"}</li>)}</ol><p className="mt-2 text-xs font-bold text-emerald-200">Original arrangement unchanged. Execution remains locked.</p></div> : null}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs font-black uppercase tracking-wider text-fuchsia-200">Generate a new major section</p>
                <p className="mt-1 text-sm text-white/60">Prepare a provider-ready verse, chorus, or bridge request. No provider is contacted in this step.</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  <label className="text-sm font-bold">Section type<select className={`${fieldClass} mt-1`} value={generatedSectionType} onChange={(event) => setGeneratedSectionType(event.target.value as typeof generatedSectionType)}><option value="verse">Verse</option><option value="chorus">Chorus</option><option value="bridge">Bridge</option></select></label>
                  <label className="text-sm font-bold">Bars<input className={`${fieldClass} mt-1`} type="number" min={1} max={128} step={1} value={generatedBars} onChange={(event) => setGeneratedBars(Number(event.target.value))} /></label>
                  <label className="text-sm font-bold">Place after<select className={`${fieldClass} mt-1`} value={destinationSectionId} onChange={(event) => setDestinationSectionId(event.target.value)}><option value="">End of song</option>{sectionRecognition.sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label>
                </div>
                <label className="mt-2 block text-sm font-bold">Describe the new section<textarea className={`${fieldClass} mt-1 min-h-24`} maxLength={4000} value={generationPrompt} onChange={(event) => setGenerationPrompt(event.target.value)} placeholder="Example: Add an eight-bar funky R&B bridge using the verse groove, with space for a sax response." /></label>
                <button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setGenerationPlan(createTimelineDawGeneratedSectionPlan({ sectionType: generatedSectionType, bars: generatedBars, prompt: generationPrompt, sections: sectionRecognition.sections, placementAfterSectionId: destinationSectionId || null })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Generation plan could not be prepared."); } }}>Prepare Generation & Placement Plan</button>
                {generationPlan ? <div className="mt-3 rounded-xl border border-fuchsia-200/20 bg-black/30 p-3" aria-live="polite"><p className="font-black">{generationPlan.name} · {generationPlan.bars} bars</p><p className="mt-1 text-sm">Place at tick {generationPlan.placementStartTick}; planned length {generationPlan.durationTicks} ticks.</p><p className="mt-1 text-sm text-white/65">{generationPlan.prompt}</p><p className="mt-2 text-xs text-amber-100">Held until an approved provider supplies: {generationPlan.requiredProvenance.join(", ")}.</p><p className="mt-1 text-xs font-bold text-emerald-200">Generated output must remain a private draft for musician audition and approval.</p></div> : null}
                {generationPlan ? <div className="mt-4 border-t border-white/10 pt-4"><p className="text-xs font-black uppercase tracking-wider text-amber-200">Arrangement-aware transition</p><div className="mt-2 grid gap-2 md:grid-cols-2"><label className="text-sm font-bold">Transition style<select className={`${fieldClass} mt-1`} value={transitionStyle} onChange={(event) => { setTransitionStyle(event.target.value as typeof transitionStyle); setTransitionPlan(null); }}><option value="clean-cut">Clean bar-line cut</option><option value="crossfade">Crossfade</option><option value="pickup">Preserve pickup into section</option><option value="tail-overlap">Let previous tail overlap</option></select></label>{transitionStyle === "crossfade" || transitionStyle === "tail-overlap" ? <label className="text-sm font-bold">Crossfade ticks<input className={`${fieldClass} mt-1`} type="number" min={1} step={1} value={transitionTicks} onChange={(event) => setTransitionTicks(Number(event.target.value))} /></label> : null}</div><div className="mt-2 flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={tempoConfirmed} onChange={(event) => setTempoConfirmed(event.target.checked)} /> Tempo/downbeat confirmed</label><label><input type="checkbox" checked={keyConfirmed} onChange={(event) => setKeyConfirmed(event.target.checked)} /> Key/modulation confirmed</label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setTransitionPlan(createTimelineDawGeneratedTransitionPlan({ generationPlan, sections: sectionRecognition.sections, style: transitionStyle, crossfadeTicks: transitionTicks, tempoCompatibility: tempoConfirmed ? "confirmed" : "review-required", keyCompatibility: keyConfirmed ? "confirmed" : "review-required" })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Transition plan could not be prepared."); } }}>Preview Section Transition</button>{transitionPlan ? <div className="mt-3 rounded-xl border border-amber-200/20 bg-black/30 p-3"><p className="font-black">{transitionPlan.style.replace("-", " ")} · entry {transitionPlan.entryFromSectionId ?? "song start"} · exit {transitionPlan.exitToSectionId ?? "song end"}</p><p className="mt-1 text-xs">Pickup {transitionPlan.preservePickup ? "preserved" : "none"} · tail {transitionPlan.preserveTail ? "preserved" : "none"} · crossfade {transitionPlan.crossfadeTicks} ticks</p>{transitionPlan.warnings.map((warning) => <p key={warning} className="mt-1 text-xs font-bold text-amber-100">Hold: {warning}</p>)}<p className="mt-2 text-xs font-bold text-emerald-200">Transition remains a private review plan. Music unchanged.</p></div> : null}</div> : null}
              </div>
            </>
          )}
        </article>
      ) : null}
      {trackSelection ? <article className="mt-5 rounded-2xl border border-sky-300/25 bg-sky-300/[0.05] p-4" aria-labelledby="verbal-track-heading"><p className="text-xs font-black uppercase tracking-wider text-sky-200">Spoken instrument and track matching</p><h3 id="verbal-track-heading" className="mt-1 text-lg font-black">Confirm the real session track</h3>{sessionTracks.length === 0 ? <p className="mt-2 text-sm text-amber-100">No private audio tracks are available in this session yet.</p> : <><p className="mt-2 text-sm text-white/60">Match confidence: <b>{trackSelection.confidence}</b>. {trackSelection.confidence === "ambiguous" || trackSelection.confidence === "unmatched" ? "Choose the intended track explicitly." : "Confirm or change the suggested track."}</p><label className="mt-3 block text-sm font-bold">Session track<select className={`${fieldClass} mt-1`} value={trackSelection.selectedTrackId ?? ""} onChange={(event) => setSelectedTrackId(event.target.value || null)}><option value="">Choose a track…</option>{sessionTracks.map((track) => <option key={track.id} value={track.id}>{track.name} · {track.kind}</option>)}</select></label>{trackSelection.matches.length ? <ol className="mt-3 space-y-1 text-xs text-white/60">{trackSelection.matches.slice(0, 5).map((match) => <li key={match.id}>{match.name} · score {match.score} · matched {match.matchedTerms.join(", ")}</li>)}</ol> : null}{trackSelection.selectedTrackId ? <p className="mt-3 text-xs font-bold text-emerald-200">Track confirmed: {sessionTracks.find((track) => track.id === trackSelection.selectedTrackId)?.name}. Routing and audio remain unchanged.</p> : <p className="mt-3 text-xs font-bold text-amber-100">No edit can proceed until a real session track is confirmed.</p>}</>}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-violet-300/25 bg-violet-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-200">Performance layers</p><h3 className="mt-1 text-lg font-black">Plan a double or triple</h3><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setPerformanceLayerPlan(createTimelineDawPerformanceLayerPlan({ instruction: heldRequest?.instruction, tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "The performance-layer plan could not be prepared."); } }}>Prepare protected layer plan</button>{performanceLayerPlan ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{performanceLayerPlan.operation.toUpperCase()}</b> {performanceLayerPlan.sourceTrackName} by adding {performanceLayerPlan.addedLayerCount} protected {performanceLayerPlan.addedLayerCount === 1 ? "layer" : "layers"} at the same timeline position.</p><ul className="mt-2 list-disc pl-5">{performanceLayerPlan.layerNames.map((name) => <li key={name}>{name}</li>)}</ul><p className="mt-2 font-bold text-amber-100">Held for review. Timing/humanization is not assumed, and the source recording cannot be changed.</p></div> : null}</article> : null}
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
