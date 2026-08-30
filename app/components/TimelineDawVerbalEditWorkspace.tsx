"use client";

import { useEffect, useState } from "react";
import { requireProjectSupabase } from "@/app/workspace/projects/[id]/projectSupabase";
import { loadDawPrivateAudioLanes } from "@/app/workspace/projects/[id]/projectDawApi";
import { createTimelineDawHardwareInventory, type TimelineDawHardwareInventory } from "@/lib/timeline/TimelineDawHardwareInventoryPolicy";
import { advanceTimelineDawHardwareSetupGuide, createTimelineDawHardwareSetupGuide, type TimelineDawHardwareSetupGuide } from "@/lib/timeline/TimelineDawHardwareSetupGuidePolicy";
import { assessTimelineDawHardwareSafety, type TimelineDawHardwareSafetyAssessment, type TimelineDawHardwareSourceType } from "@/lib/timeline/TimelineDawHardwareSafetyPolicy";
import { assessTimelineDawHardwarePreflight, type TimelineDawHardwareClockSource, type TimelineDawHardwarePreflight, type TimelineDawHardwareSampleRate, type TimelineDawHardwareSyncMode } from "@/lib/timeline/TimelineDawHardwarePreflightPolicy";
import { createTimelineDawPhysicalActionCheckpoint, verifyTimelineDawPhysicalActionCheckpoint, type TimelineDawPhysicalActionCheckpoint } from "@/lib/timeline/TimelineDawPhysicalActionCheckpointPolicy";
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
  createTimelineDawHarmonyContext,
  createTimelineDawHarmonyRecipe,
  createTimelineDawInstrumentRangePlan,
  createTimelineDawMicroEditRecipe,
  createTimelineDawMidiNoteDraft,
  assessTimelineDawNoteAnalysis,
  createTimelineDawVerbalPrivateRenderPlan,
  createTimelineDawVerbalAdCapturePlan,
  createTimelineDawVerbalDaMonitoringPlan,
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
  type TimelineDawVerbalHarmonyContext,
  type TimelineDawVerbalHarmonyRecipe,
  type TimelineDawVerbalInstrumentRangePlan,
  type TimelineDawVerbalMicroEditRecipe,
  type TimelineDawVerbalMidiNoteDraft,
  type TimelineDawVerbalNoteAnalysisAssessment,
  type TimelineDawVerbalPrivateRenderPlan,
  type TimelineDawVerbalAdCapturePlan,
  type TimelineDawVerbalDaMonitoringPlan,
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
  const [harmonyTonic, setHarmonyTonic] = useState("C");
  const [harmonyScale, setHarmonyScale] = useState<TimelineDawVerbalHarmonyContext["scale"]>("major");
  const [harmonyChord, setHarmonyChord] = useState("");
  const [harmonyInterval, setHarmonyInterval] = useState<TimelineDawVerbalHarmonyContext["interval"]>("third");
  const [harmonyDirection, setHarmonyDirection] = useState<TimelineDawVerbalHarmonyContext["direction"]>("above");
  const [harmonyContext, setHarmonyContext] = useState<TimelineDawVerbalHarmonyContext | null>(null);
  const [harmonyStartTick, setHarmonyStartTick] = useState(0);
  const [harmonyEndTick, setHarmonyEndTick] = useState(3840);
  const [harmonyRecipe, setHarmonyRecipe] = useState<TimelineDawVerbalHarmonyRecipe | null>(null);
  const [rangeInstrument, setRangeInstrument] = useState("");
  const [instrumentRangeStart, setInstrumentRangeStart] = useState(0);
  const [instrumentRangeEnd, setInstrumentRangeEnd] = useState(3840);
  const [instrumentCrossfadeTicks, setInstrumentCrossfadeTicks] = useState(0);
  const [instrumentRangePlan, setInstrumentRangePlan] = useState<TimelineDawVerbalInstrumentRangePlan | null>(null);
  const [microTargetKind, setMicroTargetKind] = useState<TimelineDawVerbalMicroEditRecipe["targetKind"]>("riff");
  const [microTargetLabel, setMicroTargetLabel] = useState("");
  const [microStartTick, setMicroStartTick] = useState(0);
  const [microEndTick, setMicroEndTick] = useState(960);
  const [microOperation, setMicroOperation] = useState<TimelineDawVerbalMicroEditRecipe["operation"]>("repeat");
  const [microRecipe, setMicroRecipe] = useState<TimelineDawVerbalMicroEditRecipe | null>(null);
  const [midiOperation, setMidiOperation] = useState<TimelineDawVerbalMidiNoteDraft["operation"]>("add");
  const [midiNote, setMidiNote] = useState(60);
  const [midiStartTick, setMidiStartTick] = useState(0);
  const [midiDurationTicks, setMidiDurationTicks] = useState(480);
  const [midiVelocity, setMidiVelocity] = useState(100);
  const [midiChannel, setMidiChannel] = useState(1);
  const [midiNoteDraft, setMidiNoteDraft] = useState<TimelineDawVerbalMidiNoteDraft | null>(null);
  const [analysisMode, setAnalysisMode] = useState<TimelineDawVerbalNoteAnalysisAssessment["analysisMode"]>("pitch-and-onset");
  const [analysisTexture, setAnalysisTexture] = useState<TimelineDawVerbalNoteAnalysisAssessment["texture"]>("monophonic");
  const [detectedNoteCount, setDetectedNoteCount] = useState(1);
  const [pitchConfidence, setPitchConfidence] = useState(0.9);
  const [onsetConfidence, setOnsetConfidence] = useState(0.85);
  const [analysisAssessment, setAnalysisAssessment] = useState<TimelineDawVerbalNoteAnalysisAssessment | null>(null);
  const [renderDraftKind, setRenderDraftKind] = useState<TimelineDawVerbalPrivateRenderPlan["draftKind"]>("protected-audio-draft");
  const [renderStartTick, setRenderStartTick] = useState(0);
  const [renderEndTick, setRenderEndTick] = useState(3840);
  const [renderBitDepth, setRenderBitDepth] = useState<24 | 32>(24);
  const [privateRenderPlan, setPrivateRenderPlan] = useState<TimelineDawVerbalPrivateRenderPlan | null>(null);
  const [adInterfaceName, setAdInterfaceName] = useState("");
  const [adInputChannel, setAdInputChannel] = useState(1);
  const [adSourceType, setAdSourceType] = useState<TimelineDawVerbalAdCapturePlan["sourceType"]>("microphone");
  const [adConnectionConfirmed, setAdConnectionConfirmed] = useState(false);
  const [adSampleRate, setAdSampleRate] = useState<TimelineDawVerbalAdCapturePlan["sampleRate"]>(48_000);
  const [adBitDepth, setAdBitDepth] = useState<24 | 32>(24);
  const [adCapturePlan, setAdCapturePlan] = useState<TimelineDawVerbalAdCapturePlan | null>(null);
  const [daOutputName, setDaOutputName] = useState("Outputs 1–2");
  const [daDestination, setDaDestination] = useState<TimelineDawVerbalDaMonitoringPlan["destination"]>("headphones");
  const [daLowLevelConfirmed, setDaLowLevelConfirmed] = useState(false);
  const [daMonitoringPlan, setDaMonitoringPlan] = useState<TimelineDawVerbalDaMonitoringPlan | null>(null);
  const [hardwareInventory, setHardwareInventory] = useState<TimelineDawHardwareInventory | null>(null);
  const [hardwareScanning, setHardwareScanning] = useState(false);
  const [setupSourceLabel, setSetupSourceLabel] = useState("");
  const [setupCableType, setSetupCableType] = useState<TimelineDawHardwareSetupGuide["cableType"]>("xlr");
  const [setupRoute, setSetupRoute] = useState<TimelineDawHardwareSetupGuide["route"]>("direct");
  const [setupGuide, setSetupGuide] = useState<TimelineDawHardwareSetupGuide | null>(null);
  const [setupStepConfirmed, setSetupStepConfirmed] = useState(false);
  const [safetySourceType, setSafetySourceType] = useState<TimelineDawHardwareSourceType>("dynamic-microphone");
  const [phantomPower, setPhantomPower] = useState<TimelineDawHardwareSafetyAssessment["phantomPower"]>("off");
  const [inputGainDown, setInputGainDown] = useState(false);
  const [monitorLevelDown, setMonitorLevelDown] = useState(false);
  const [cableBeforePower, setCableBeforePower] = useState(false);
  const [safetyAssessment, setSafetyAssessment] = useState<TimelineDawHardwareSafetyAssessment | null>(null);
  const [preflightPeak, setPreflightPeak] = useState(-18);
  const [preflightClockSource, setPreflightClockSource] = useState<TimelineDawHardwareClockSource>("internal");
  const [preflightClockLocked, setPreflightClockLocked] = useState(false);
  const [preflightInterfaceRate, setPreflightInterfaceRate] = useState<TimelineDawHardwareSampleRate>(48_000);
  const [preflightSessionRate, setPreflightSessionRate] = useState<TimelineDawHardwareSampleRate>(48_000);
  const [preflightSyncMode, setPreflightSyncMode] = useState<TimelineDawHardwareSyncMode>("free-run");
  const [preflightSyncConfirmed, setPreflightSyncConfirmed] = useState(false);
  const [hardwarePreflight, setHardwarePreflight] = useState<TimelineDawHardwarePreflight | null>(null);
  const [physicalActionInstruction, setPhysicalActionInstruction] = useState("");
  const [physicalActionConfirmed, setPhysicalActionConfirmed] = useState(false);
  const [physicalActionVerification, setPhysicalActionVerification] = useState<TimelineDawPhysicalActionCheckpoint["verification"]>("not-verified");
  const [physicalActionVerificationNote, setPhysicalActionVerificationNote] = useState("");
  const [physicalActionCheckpoint, setPhysicalActionCheckpoint] = useState<TimelineDawPhysicalActionCheckpoint | null>(null);
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
      setHarmonyContext(null);
      setHarmonyRecipe(null);
      setInstrumentRangePlan(null);
      setMicroRecipe(null);
      setMidiNoteDraft(null);
      setAnalysisAssessment(null);
      setPrivateRenderPlan(null);
      setAdCapturePlan(null);
      setDaMonitoringPlan(null);
      setDecisionExplanation("");
      setError(null);
    } catch (cause) {
      setHeldRequest(null);
      setError(cause instanceof Error ? cause.message : "The edit request could not be prepared.");
    }
  }

  async function detectHardware() {
    setHardwareScanning(true);
    setError(null);
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.enumerateDevices) throw new Error("Chrome does not expose audio-device detection on this page.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      setHardwareInventory(createTimelineDawHardwareInventory(devices.filter((device) => device.kind === "audioinput" || device.kind === "audiooutput").map((device) => ({ deviceId: device.deviceId, groupId: device.groupId, kind: device.kind as "audioinput" | "audiooutput", label: device.label }))));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connected audio hardware could not be detected.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setHardwareScanning(false);
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
        <button type="button" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-black disabled:opacity-40" disabled={!instruction && !heldRequest} onClick={() => { setInstruction(""); setHeldRequest(null); setPlanDecision(null); setRevisionHistory(null); setSelectedSectionId(null); setSelectedTrackId(null); setPerformanceLayerPlan(null); setHarmonyContext(null); setHarmonyRecipe(null); setInstrumentRangePlan(null); setMicroRecipe(null); setMidiNoteDraft(null); setAnalysisAssessment(null); setSectionRecipe(null); setGenerationPlan(null); setTransitionPlan(null); setDecisionExplanation(""); setError(null); }}>Clear Request</button>
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
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-cyan-200">Instrument by range</p><h3 className="mt-1 text-lg font-black">Limit a new instrument to one musical area</h3><div className="mt-3 grid gap-3 md:grid-cols-5"><label className="text-sm font-bold">Replacement instrument<input className={`${fieldClass} mt-1`} value={rangeInstrument} onChange={(event) => setRangeInstrument(event.target.value)} placeholder="Example: tenor sax" /></label><label className="text-sm font-bold">Named section<select className={`${fieldClass} mt-1`} value={selectedSectionId ?? ""} onChange={(event) => setSelectedSectionId(event.target.value || null)}><option value="">Use exact ticks</option>{namedSections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select></label><label className="text-sm font-bold">Start tick<input type="number" min={0} step={1} disabled={Boolean(selectedSectionId)} className={`${fieldClass} mt-1`} value={instrumentRangeStart} onChange={(event) => setInstrumentRangeStart(Number(event.target.value))} /></label><label className="text-sm font-bold">End tick<input type="number" min={1} step={1} disabled={Boolean(selectedSectionId)} className={`${fieldClass} mt-1`} value={instrumentRangeEnd} onChange={(event) => setInstrumentRangeEnd(Number(event.target.value))} /></label><label className="text-sm font-bold">Boundary crossfade ticks<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={instrumentCrossfadeTicks} onChange={(event) => setInstrumentCrossfadeTicks(Number(event.target.value))} /></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setInstrumentRangePlan(createTimelineDawInstrumentRangePlan({ tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, targetInstrument: rangeInstrument, sections: namedSections, sectionId: selectedSectionId, startTick: instrumentRangeStart, endTick: instrumentRangeEnd, crossfadeTicks: instrumentCrossfadeTicks })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Instrument-range plan could not be prepared."); } }}>Prepare instrument-range plan</button>{instrumentRangePlan ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p>Use <b>{instrumentRangePlan.targetInstrument}</b> for {instrumentRangePlan.sectionName ?? `ticks ${instrumentRangePlan.startTick}–${instrumentRangePlan.endTick}`} only.</p><p className="mt-1">Entry/exit crossfade: {instrumentRangePlan.entryCrossfadeTicks} ticks. Everywhere outside the range remains the original instrument.</p><p className="mt-2 font-bold text-amber-100">Held for review. The source performance and current arrangement remain unchanged.</p></div> : null}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-rose-200">Detailed verbal target</p><h3 className="mt-1 text-lg font-black">Edit a phrase, riff, chord, or note</h3><div className="mt-3 grid gap-3 md:grid-cols-5"><label className="text-sm font-bold">Target type<select className={`${fieldClass} mt-1`} value={microTargetKind} onChange={(event) => setMicroTargetKind(event.target.value as TimelineDawVerbalMicroEditRecipe["targetKind"])}>{["phrase", "riff", "chord", "note"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-bold">Target label<input className={`${fieldClass} mt-1`} value={microTargetLabel} onChange={(event) => setMicroTargetLabel(event.target.value)} placeholder="Example: opening bass riff" /></label><label className="text-sm font-bold">Start tick<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={microStartTick} onChange={(event) => setMicroStartTick(Number(event.target.value))} /></label><label className="text-sm font-bold">End tick<input type="number" min={1} step={1} className={`${fieldClass} mt-1`} value={microEndTick} onChange={(event) => setMicroEndTick(Number(event.target.value))} /></label><label className="text-sm font-bold">Action<select className={`${fieldClass} mt-1`} value={microOperation} onChange={(event) => setMicroOperation(event.target.value as TimelineDawVerbalMicroEditRecipe["operation"])}>{["move", "repeat", "replace", "transpose", "trim", "quantize"].map((value) => <option key={value}>{value}</option>)}</select></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setMicroRecipe(createTimelineDawMicroEditRecipe({ tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, targetKind: microTargetKind, targetLabel: microTargetLabel, startTick: microStartTick, endTick: microEndTick, operation: microOperation, instruction: heldRequest?.instruction })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Detailed verbal recipe could not be prepared."); } }}>Prepare detailed edit recipe</button>{microRecipe ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{microRecipe.operation.toUpperCase()}</b> the {microRecipe.targetKind} “{microRecipe.targetLabel}” on {microRecipe.sourceTrackName}, ticks {microRecipe.startTick}–{microRecipe.endTick}.</p><p className="mt-1">Instruction: {microRecipe.instruction}</p><p className="mt-2 font-bold text-amber-100">Held for review as a new draft revision. The source cannot be changed.</p></div> : null}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-indigo-300/25 bg-indigo-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-indigo-200">Exact MIDI note</p><h3 className="mt-1 text-lg font-black">Set pitch, timing, velocity, and channel</h3><div className="mt-3 grid gap-3 md:grid-cols-6"><label className="text-sm font-bold">Action<select className={`${fieldClass} mt-1`} value={midiOperation} onChange={(event) => setMidiOperation(event.target.value as TimelineDawVerbalMidiNoteDraft["operation"])}><option value="add">add</option><option value="update">update</option><option value="remove">remove</option></select></label><label className="text-sm font-bold">MIDI pitch<input type="number" min={0} max={127} step={1} className={`${fieldClass} mt-1`} value={midiNote} onChange={(event) => setMidiNote(Number(event.target.value))} /></label><label className="text-sm font-bold">Start tick<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={midiStartTick} onChange={(event) => setMidiStartTick(Number(event.target.value))} /></label><label className="text-sm font-bold">Duration ticks<input type="number" min={1} step={1} className={`${fieldClass} mt-1`} value={midiDurationTicks} onChange={(event) => setMidiDurationTicks(Number(event.target.value))} /></label><label className="text-sm font-bold">Velocity<input type="number" min={1} max={127} step={1} className={`${fieldClass} mt-1`} value={midiVelocity} onChange={(event) => setMidiVelocity(Number(event.target.value))} /></label><label className="text-sm font-bold">Channel<input type="number" min={1} max={16} step={1} className={`${fieldClass} mt-1`} value={midiChannel} onChange={(event) => setMidiChannel(Number(event.target.value))} /></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setMidiNoteDraft(createTimelineDawMidiNoteDraft({ tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, operation: midiOperation, midiNote, startTick: midiStartTick, durationTicks: midiDurationTicks, velocity: midiVelocity, channel: midiChannel })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "MIDI-note draft could not be prepared."); } }}>Prepare exact MIDI note</button>{midiNoteDraft ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{midiNoteDraft.operation.toUpperCase()} {midiNoteDraft.noteName}</b> (MIDI {midiNoteDraft.midiNote}) at tick {midiNoteDraft.startTick} for {midiNoteDraft.durationTicks} ticks, velocity {midiNoteDraft.velocity}, channel {midiNoteDraft.channel}.</p><p className="mt-1">Draft lane: {midiNoteDraft.outputLaneName}</p><p className="mt-2 font-bold text-amber-100">Held for MIDI review. No source, notes, or audio have changed.</p></div> : null}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-lime-300/25 bg-lime-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-lime-200">Audio note-analysis reliability</p><h3 className="mt-1 text-lg font-black">Decide whether analysis is safe enough to assist</h3><div className="mt-3 grid gap-3 md:grid-cols-5"><label className="text-sm font-bold">Analysis<select className={`${fieldClass} mt-1`} value={analysisMode} onChange={(event) => setAnalysisMode(event.target.value as TimelineDawVerbalNoteAnalysisAssessment["analysisMode"])}><option value="pitch-and-onset">pitch and onset</option><option value="audio-to-midi">audio to MIDI</option></select></label><label className="text-sm font-bold">Texture<select className={`${fieldClass} mt-1`} value={analysisTexture} onChange={(event) => setAnalysisTexture(event.target.value as TimelineDawVerbalNoteAnalysisAssessment["texture"])}><option value="monophonic">monophonic</option><option value="polyphonic">polyphonic</option><option value="percussive">percussive</option></select></label><label className="text-sm font-bold">Detected notes<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={detectedNoteCount} onChange={(event) => setDetectedNoteCount(Number(event.target.value))} /></label><label className="text-sm font-bold">Pitch confidence<input type="number" min={0} max={1} step={0.01} className={`${fieldClass} mt-1`} value={pitchConfidence} onChange={(event) => setPitchConfidence(Number(event.target.value))} /></label><label className="text-sm font-bold">Onset confidence<input type="number" min={0} max={1} step={0.01} className={`${fieldClass} mt-1`} value={onsetConfidence} onChange={(event) => setOnsetConfidence(Number(event.target.value))} /></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setAnalysisAssessment(assessTimelineDawNoteAnalysis({ tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, analysisMode, texture: analysisTexture, detectedNoteCount, pitchConfidence, onsetConfidence })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Note-analysis reliability could not be assessed."); } }}>Assess analysis reliability</button>{analysisAssessment ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p>Reliability: <b>{analysisAssessment.reliability}</b>. MIDI draft allowed: <b>{analysisAssessment.midiDraftAllowed ? "yes, after human review" : "no"}</b>.</p>{analysisAssessment.warnings.map((warning) => <p className="mt-1 text-amber-100" key={warning}>{warning}</p>)}<p className="mt-2 font-bold text-emerald-200">Human verification is always required. Nothing is converted or changed automatically.</p></div> : null}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-sky-300/25 bg-sky-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-sky-200">Protected digital render</p><h3 className="mt-1 text-lg font-black">Prepare a private WAV for audition</h3><p className="mt-1 text-sm text-white/60">The handoff uses the DAW’s existing protected renderer and owner-only expiring audition links.</p><div className="mt-3 grid gap-3 md:grid-cols-4"><label className="text-sm font-bold">Draft to render<select className={`${fieldClass} mt-1`} value={renderDraftKind} onChange={(event) => setRenderDraftKind(event.target.value as TimelineDawVerbalPrivateRenderPlan["draftKind"])}><option value="protected-audio-draft">protected audio draft</option><option value="midi-bounce-draft">MIDI bounce draft</option><option value="generated-section-draft">generated section draft</option></select></label><label className="text-sm font-bold">Start tick<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={renderStartTick} onChange={(event) => setRenderStartTick(Number(event.target.value))} /></label><label className="text-sm font-bold">End tick<input type="number" min={1} step={1} className={`${fieldClass} mt-1`} value={renderEndTick} onChange={(event) => setRenderEndTick(Number(event.target.value))} /></label><label className="text-sm font-bold">WAV depth<select className={`${fieldClass} mt-1`} value={renderBitDepth} onChange={(event) => setRenderBitDepth(Number(event.target.value) as 24 | 32)}><option value={24}>24-bit</option><option value={32}>32-bit float</option></select></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setPrivateRenderPlan(createTimelineDawVerbalPrivateRenderPlan({ tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, draftKind: renderDraftKind, startTick: renderStartTick, endTick: renderEndTick, bitDepth: renderBitDepth })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Private render handoff could not be prepared."); } }}>Prepare private render handoff</button>{privateRenderPlan ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{privateRenderPlan.sourceTrackName}</b> · ticks {privateRenderPlan.startTick}–{privateRenderPlan.endTick} · {privateRenderPlan.bitDepth}-bit / 48 kHz stereo WAV</p><p className="mt-1">Result: private protected render with an owner-only expiring audition link.</p><p className="mt-2 font-bold text-emerald-200">Original source locked. Publishing, source replacement, and automatic promotion are blocked.</p><a href="#daw-export-workspace" className="mt-3 inline-block rounded-xl border border-sky-200/40 bg-sky-100 px-4 py-3 font-black text-sky-950">Open protected render and audition controls</a></div> : <p className="mt-3 text-xs font-bold text-amber-100">Prepare and review the handoff before opening render controls. No audio has been rendered yet.</p>}</article> : null}
      <article className="mt-5 rounded-2xl border border-orange-300/25 bg-orange-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-orange-200">Connected-interface A/D capture</p><h3 className="mt-1 text-lg font-black">Turn an analog source into a private digital take</h3><p className="mt-1 text-sm text-white/60">A human confirms the physical cable. The DAW then verifies the live digital signal before capture.</p><div className="mt-3 grid gap-3 md:grid-cols-3"><label className="text-sm font-bold">Audio interface<input className={`${fieldClass} mt-1`} value={adInterfaceName} maxLength={120} onChange={(event) => setAdInterfaceName(event.target.value)} placeholder="Example: Focusrite Scarlett 2i2" /></label><label className="text-sm font-bold">Input channel<input type="number" min={1} max={128} step={1} className={`${fieldClass} mt-1`} value={adInputChannel} onChange={(event) => setAdInputChannel(Number(event.target.value))} /></label><label className="text-sm font-bold">Analog source<select className={`${fieldClass} mt-1`} value={adSourceType} onChange={(event) => setAdSourceType(event.target.value as TimelineDawVerbalAdCapturePlan["sourceType"])}><option value="microphone">microphone</option><option value="instrument">instrument</option><option value="line">line output</option></select></label><label className="text-sm font-bold">Sample rate<select className={`${fieldClass} mt-1`} value={adSampleRate} onChange={(event) => setAdSampleRate(Number(event.target.value) as TimelineDawVerbalAdCapturePlan["sampleRate"])}><option value={44_100}>44.1 kHz</option><option value={48_000}>48 kHz</option><option value={96_000}>96 kHz</option></select></label><label className="text-sm font-bold">Capture depth<select className={`${fieldClass} mt-1`} value={adBitDepth} onChange={(event) => setAdBitDepth(Number(event.target.value) as 24 | 32)}><option value={24}>24-bit</option><option value={32}>32-bit float</option></select></label><label className="flex items-center gap-2 rounded-xl border border-white/15 p-3 text-sm font-bold"><input type="checkbox" checked={adConnectionConfirmed} onChange={(event) => setAdConnectionConfirmed(event.target.checked)} />I physically connected this source to this input</label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setAdCapturePlan(createTimelineDawVerbalAdCapturePlan({ interfaceName: adInterfaceName, inputChannel: adInputChannel, sourceType: adSourceType, connectionConfirmedByHuman: adConnectionConfirmed, sampleRate: adSampleRate, bitDepth: adBitDepth })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "A/D capture plan could not be prepared."); } }}>Prepare three-step A/D workflow</button>{adCapturePlan ? <ol className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-3"><li className="rounded-xl border border-white/15 p-3"><b>1. CONNECTED</b><br />{adCapturePlan.sourceType} → {adCapturePlan.interfaceName} input {adCapturePlan.inputChannel}</li><li className="rounded-xl border border-amber-300/30 p-3"><b>2. VERIFY NEXT</b><br />Permission, clock, sample rate, and peaks from −18 to −6 dBFS</li><li className="rounded-xl border border-white/15 p-3"><b>3. CAPTURE AFTER VERIFY</b><br />New private {adCapturePlan.bitDepth}-bit WAV take; source remains untouched</li></ol> : <p className="mt-3 text-xs font-bold text-amber-100">The workflow stays held until a human confirms the physical connection.</p>}</article>
      <article className="mt-5 rounded-2xl border border-teal-300/25 bg-teal-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-teal-200">Connected-interface D/A monitoring</p><h3 className="mt-1 text-lg font-black">Hear the private result through studio hardware</h3><div className="mt-3 grid gap-3 md:grid-cols-3"><label className="text-sm font-bold">Interface output<input className={`${fieldClass} mt-1`} value={daOutputName} maxLength={120} onChange={(event) => setDaOutputName(event.target.value)} /></label><label className="text-sm font-bold">Listening destination<select className={`${fieldClass} mt-1`} value={daDestination} onChange={(event) => setDaDestination(event.target.value as TimelineDawVerbalDaMonitoringPlan["destination"])}><option value="headphones">headphones</option><option value="studio-monitors">studio monitors</option></select></label><label className="flex items-center gap-2 rounded-xl border border-white/15 p-3 text-sm font-bold"><input type="checkbox" checked={daLowLevelConfirmed} onChange={(event) => setDaLowLevelConfirmed(event.target.checked)} />I turned the interface output down to a safe low level</label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setDaMonitoringPlan(createTimelineDawVerbalDaMonitoringPlan({ interfaceName: adInterfaceName, outputName: daOutputName, destination: daDestination, sampleRate: adSampleRate, lowLevelConfirmedByHuman: daLowLevelConfirmed })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "D/A monitoring plan could not be prepared."); } }}>Prepare three-step D/A workflow</button>{daMonitoringPlan ? <ol className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-3"><li className="rounded-xl border border-white/15 p-3"><b>1. ROUTE</b><br />Private audition → {daMonitoringPlan.interfaceName} {daMonitoringPlan.outputName}</li><li className="rounded-xl border border-emerald-300/30 p-3"><b>2. SAFE LEVEL CONFIRMED</b><br />Start low through {daMonitoringPlan.destination.replace("-", " ")}</li><li className="rounded-xl border border-amber-300/30 p-3"><b>3. VERIFY NEXT</b><br />Play privately; confirm left/right output before raising level</li></ol> : <p className="mt-3 text-xs font-bold text-amber-100">Playback remains held until the interface is named and a human confirms a safe low output level.</p>}</article>
      <article className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-cyan-200">Studio hardware inventory</p><h3 className="mt-1 text-lg font-black">Detect what Chrome can actually see</h3><p className="mt-1 text-sm text-white/60">Device names stay in this tab only. Detection does not claim that analog cables, speakers, patch bays, or phantom power are connected.</p><button type="button" className={`${buttonClass} mt-3`} disabled={hardwareScanning} onClick={() => void detectHardware()}>{hardwareScanning ? "Waiting for Chrome…" : "Detect connected audio devices"}</button>{hardwareInventory ? <div className="mt-3"><p className="font-black">{hardwareInventory.inputCount} inputs · {hardwareInventory.outputCount} outputs · {hardwareInventory.status.replaceAll("-", " ")}</p><ul className="mt-2 grid gap-2 md:grid-cols-2">{hardwareInventory.items.map((item) => <li className="rounded-xl border border-white/15 p-3 text-sm" key={`${item.kind}:${item.deviceId}`}><b>{item.displayName}</b><br /><span className="text-white/55">{item.role} · browser detected</span></li>)}</ul>{hardwareInventory.warnings.map((warning) => <p className="mt-2 text-xs font-bold text-amber-100" key={warning}>{warning}</p>)}</div> : null}</article>
      <article className="mt-5 rounded-2xl border border-yellow-300/25 bg-yellow-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-yellow-200">Baby-step studio setup</p><h3 className="mt-1 text-lg font-black">Show one physical connection step at a time</h3><div className="mt-3 grid gap-3 md:grid-cols-3"><label className="text-sm font-bold">Source name<input className={`${fieldClass} mt-1`} value={setupSourceLabel} maxLength={120} onChange={(event) => setSetupSourceLabel(event.target.value)} placeholder="Example: vocal microphone" /></label><label className="text-sm font-bold">Cable<select className={`${fieldClass} mt-1`} value={setupCableType} onChange={(event) => setSetupCableType(event.target.value as TimelineDawHardwareSetupGuide["cableType"])}><option value="xlr">XLR</option><option value="trs">TRS</option><option value="ts">TS instrument</option></select></label><label className="text-sm font-bold">Route<select className={`${fieldClass} mt-1`} value={setupRoute} onChange={(event) => setSetupRoute(event.target.value as TimelineDawHardwareSetupGuide["route"])}><option value="direct">direct to interface</option><option value="patch-bay">through patch bay</option></select></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setSetupGuide(createTimelineDawHardwareSetupGuide({ sourceLabel: setupSourceLabel, interfaceLabel: adInterfaceName, inputChannel: adInputChannel, cableType: setupCableType, route: setupRoute })); setSetupStepConfirmed(false); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Hardware setup guide could not be prepared."); } }}>Start baby-step setup</button>{setupGuide ? <div className="mt-3 rounded-xl border border-white/15 p-4">{setupGuide.status === "waiting-for-human-action" ? <><p className="text-xs font-black uppercase text-yellow-200">Step {setupGuide.currentStepIndex + 1} of {setupGuide.steps.length}</p><p className="mt-2 text-lg font-black">{setupGuide.steps[setupGuide.currentStepIndex]?.instruction}</p><label className="mt-3 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={setupStepConfirmed} onChange={(event) => setSetupStepConfirmed(event.target.checked)} />I completed this exact physical step</label><button type="button" className={`${buttonClass} mt-3`} disabled={!setupStepConfirmed} onClick={() => { try { setSetupGuide(advanceTimelineDawHardwareSetupGuide(setupGuide, setupStepConfirmed)); setSetupStepConfirmed(false); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "The setup guide could not continue."); } }}>Confirm and show next step</button></> : <><p className="font-black text-emerald-200">Physical setup steps complete.</p><p className="mt-1 text-sm text-white/65">Next: verify a real signal before recording. No cable or signal was assumed automatically.</p></>}</div> : null}</article>
      <article className="mt-5 rounded-2xl border border-red-300/30 bg-red-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-red-200">Hardware safety gate</p><h3 className="mt-1 text-lg font-black">Stop unsafe power, gain, and monitoring states</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Source type<select className={`${fieldClass} mt-1`} value={safetySourceType} onChange={(event) => setSafetySourceType(event.target.value as TimelineDawHardwareSourceType)}><option value="dynamic-microphone">dynamic microphone</option><option value="condenser-microphone">condenser microphone</option><option value="ribbon-microphone">ribbon microphone</option><option value="instrument">instrument</option><option value="line-level">line level</option></select></label><label className="text-sm font-bold">Phantom power plan<select className={`${fieldClass} mt-1`} value={phantomPower} onChange={(event) => setPhantomPower(event.target.value as TimelineDawHardwareSafetyAssessment["phantomPower"])}><option value="off">keep off</option><option value="requested">request +48V after checks</option></select></label></div><div className="mt-3 grid gap-2"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={inputGainDown} onChange={(event) => setInputGainDown(event.target.checked)} />Selected input gain is fully down</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={monitorLevelDown} onChange={(event) => setMonitorLevelDown(event.target.checked)} />Headphone and monitor levels are down</label><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={cableBeforePower} onChange={(event) => setCableBeforePower(event.target.checked)} />Cable is connected before any phantom-power change</label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setSafetyAssessment(assessTimelineDawHardwareSafety({ sourceType: safetySourceType, phantomPower, inputGainDown, monitorLevelDown, cableConnectedBeforePowerChange: cableBeforePower })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Hardware safety could not be assessed."); } }}>Check hardware safety</button>{safetyAssessment ? <div className={`mt-3 rounded-xl border p-3 ${safetyAssessment.status === "safe-to-test-signal" ? "border-emerald-300/30" : "border-red-300/40"}`}><p className="font-black">{safetyAssessment.status === "safe-to-test-signal" ? "SAFE TO TEST SIGNAL" : "BLOCKED—DO NOT CONTINUE"}</p>{safetyAssessment.blockers.map((item) => <p className="mt-1 text-sm text-red-100" key={item}>{item}</p>)}{safetyAssessment.warnings.map((item) => <p className="mt-1 text-xs font-bold text-amber-100" key={item}>{item}</p>)}<p className="mt-2 text-xs text-white/55">The DAW never switches phantom power or hardware controls automatically.</p></div> : null}</article>
      <article className="mt-5 rounded-2xl border border-blue-300/30 bg-blue-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-blue-200">Four-part signal preflight</p><h3 className="mt-1 text-lg font-black">Verify gain, clock, sample rate, and synchronization together</h3><p className="mt-1 text-sm text-white/60">This check is available only after the hardware safety gate reports SAFE TO TEST SIGNAL.</p><div className="mt-3 grid gap-3 md:grid-cols-4"><label className="text-sm font-bold">Measured peak (dBFS)<input type="number" min={-120} max={0} step={0.1} className={`${fieldClass} mt-1`} value={preflightPeak} onChange={(event) => setPreflightPeak(Number(event.target.value))} /></label><label className="text-sm font-bold">Clock source<select className={`${fieldClass} mt-1`} value={preflightClockSource} onChange={(event) => setPreflightClockSource(event.target.value as TimelineDawHardwareClockSource)}><option value="internal">internal</option><option value="external-word-clock">external word clock</option><option value="digital-input">digital input</option></select></label><label className="text-sm font-bold">Interface rate<select className={`${fieldClass} mt-1`} value={preflightInterfaceRate} onChange={(event) => setPreflightInterfaceRate(Number(event.target.value) as TimelineDawHardwareSampleRate)}>{[44100,48000,88200,96000,192000].map((rate) => <option value={rate} key={rate}>{rate / 1000} kHz</option>)}</select></label><label className="text-sm font-bold">Session rate<select className={`${fieldClass} mt-1`} value={preflightSessionRate} onChange={(event) => setPreflightSessionRate(Number(event.target.value) as TimelineDawHardwareSampleRate)}>{[44100,48000,88200,96000,192000].map((rate) => <option value={rate} key={rate}>{rate / 1000} kHz</option>)}</select></label><label className="text-sm font-bold">Synchronization<select className={`${fieldClass} mt-1`} value={preflightSyncMode} onChange={(event) => setPreflightSyncMode(event.target.value as TimelineDawHardwareSyncMode)}><option value="free-run">free run</option><option value="word-clock">word clock</option><option value="adat">ADAT</option><option value="spdif">S/PDIF</option></select></label><label className="flex items-center gap-2 rounded-xl border border-white/15 p-3 text-sm font-bold"><input type="checkbox" checked={preflightClockLocked} onChange={(event) => setPreflightClockLocked(event.target.checked)} />Hardware shows clock locked</label><label className="flex items-center gap-2 rounded-xl border border-white/15 p-3 text-sm font-bold"><input type="checkbox" checked={preflightSyncConfirmed} onChange={(event) => setPreflightSyncConfirmed(event.target.checked)} />I confirmed synchronization on the hardware</label></div><button type="button" className={`${buttonClass} mt-3`} disabled={safetyAssessment?.status !== "safe-to-test-signal"} onClick={() => { try { setHardwarePreflight(assessTimelineDawHardwarePreflight({ gainPeakDbfs: preflightPeak, clockSource: preflightClockSource, clockLocked: preflightClockLocked, interfaceSampleRate: preflightInterfaceRate, sessionSampleRate: preflightSessionRate, synchronization: preflightSyncMode, synchronizationConfirmed: preflightSyncConfirmed })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Hardware preflight could not be assessed."); } }}>Run four-part preflight</button>{hardwarePreflight ? <div className={`mt-3 rounded-xl border p-3 ${hardwarePreflight.status === "ready" ? "border-emerald-300/30" : "border-amber-300/40"}`}><p className="font-black">{hardwarePreflight.status === "ready" ? "PREFLIGHT READY—CAPTURE MAY BE STARTED BY THE MUSICIAN" : "PREFLIGHT HELD"}</p><ol className="mt-2 grid gap-2 md:grid-cols-2">{hardwarePreflight.checks.map((check) => <li className="rounded-xl border border-white/15 p-3 text-sm" key={check.id}><b>{check.status === "pass" ? "PASS" : "HOLD"} · {check.id.replaceAll("-", " ")}</b><br />{check.message}</li>)}</ol><p className="mt-2 text-xs text-white/55">Passing preflight never starts capture automatically and is not saved outside this tab.</p></div> : <p className="mt-3 text-xs font-bold text-amber-100">Complete the safety gate first. All four preflight checks must pass at the same time.</p>}</article>
      <article className="mt-5 rounded-2xl border border-violet-300/30 bg-violet-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-200">Human action checkpoint</p><h3 className="mt-1 text-lg font-black">Pause, complete one physical action, verify, and resume</h3>{!physicalActionCheckpoint ? <><label className="mt-3 block text-sm font-bold">One exact physical action<input className={`${fieldClass} mt-1`} value={physicalActionInstruction} maxLength={240} onChange={(event) => setPhysicalActionInstruction(event.target.value)} placeholder="Example: Connect interface output 1 to the left monitor input." /></label><button type="button" className={`${buttonClass} mt-3`} disabled={hardwarePreflight?.status !== "ready"} onClick={() => { try { setPhysicalActionCheckpoint(createTimelineDawPhysicalActionCheckpoint(physicalActionInstruction)); setPhysicalActionConfirmed(false); setPhysicalActionVerification("not-verified"); setPhysicalActionVerificationNote(""); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Physical action checkpoint could not be created."); } }}>Pause for this physical action</button><p className="mt-2 text-xs font-bold text-amber-100">A READY four-part preflight is required first.</p></> : physicalActionCheckpoint.status === "paused-for-human" ? <div className="mt-3 rounded-xl border border-violet-300/30 p-4"><p className="text-xs font-black uppercase text-violet-200">PAUSED FOR HUMAN</p><p className="mt-2 text-lg font-black">{physicalActionCheckpoint.instruction}</p><label className="mt-3 flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={physicalActionConfirmed} onChange={(event) => setPhysicalActionConfirmed(event.target.checked)} />I completed this exact physical action</label><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">How was it verified?<select className={`${fieldClass} mt-1`} value={physicalActionVerification} onChange={(event) => setPhysicalActionVerification(event.target.value as TimelineDawPhysicalActionCheckpoint["verification"])}><option value="not-verified">not verified yet</option><option value="signal-detected">signal detected</option><option value="connection-confirmed">connection visually confirmed</option><option value="hardware-indicator-confirmed">hardware indicator confirmed</option></select></label><label className="text-sm font-bold">Short verification note<input className={`${fieldClass} mt-1`} value={physicalActionVerificationNote} maxLength={240} onChange={(event) => setPhysicalActionVerificationNote(event.target.value)} placeholder="Example: Left output meter moved." /></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setPhysicalActionCheckpoint(verifyTimelineDawPhysicalActionCheckpoint({ checkpoint: physicalActionCheckpoint, physicalActionConfirmed, verification: physicalActionVerification, verificationNote: physicalActionVerificationNote })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Physical action could not be verified."); } }}>Verify and resume workflow</button></div> : <div className="mt-3 rounded-xl border border-emerald-300/30 p-4"><p className="font-black text-emerald-200">VERIFIED—WORKFLOW MAY RESUME</p><p className="mt-1 text-sm">{physicalActionCheckpoint.instruction}</p><p className="mt-1 text-sm text-white/65">Evidence: {physicalActionCheckpoint.verification.replaceAll("-", " ")} · {physicalActionCheckpoint.verificationNote}</p><button type="button" className={`${buttonClass} mt-3`} onClick={() => { setPhysicalActionCheckpoint(null); setPhysicalActionInstruction(""); }}>Prepare another physical action</button></div>}<p className="mt-2 text-xs text-white/55">The DAW never performs the physical action and does not store these studio details.</p></article>
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-violet-300/25 bg-violet-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-violet-200">Performance layers</p><h3 className="mt-1 text-lg font-black">Plan a double or triple</h3><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setPerformanceLayerPlan(createTimelineDawPerformanceLayerPlan({ instruction: heldRequest?.instruction, tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "The performance-layer plan could not be prepared."); } }}>Prepare protected layer plan</button>{performanceLayerPlan ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{performanceLayerPlan.operation.toUpperCase()}</b> {performanceLayerPlan.sourceTrackName} by adding {performanceLayerPlan.addedLayerCount} protected {performanceLayerPlan.addedLayerCount === 1 ? "layer" : "layers"} at the same timeline position.</p><ul className="mt-2 list-disc pl-5">{performanceLayerPlan.layerNames.map((name) => <li key={name}>{name}</li>)}</ul><p className="mt-2 font-bold text-amber-100">Held for review. Timing/humanization is not assumed, and the source recording cannot be changed.</p></div> : null}</article> : null}
      {trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-amber-200">Harmony context</p><h3 className="mt-1 text-lg font-black">Confirm tonic, scale, chord, and interval</h3><div className="mt-3 grid gap-3 md:grid-cols-5"><label className="text-sm font-bold">Tonic<input className={`${fieldClass} mt-1`} value={harmonyTonic} onChange={(event) => setHarmonyTonic(event.target.value)} /></label><label className="text-sm font-bold">Scale<select className={`${fieldClass} mt-1`} value={harmonyScale} onChange={(event) => setHarmonyScale(event.target.value as TimelineDawVerbalHarmonyContext["scale"])}>{["major", "minor", "dorian", "mixolydian", "chromatic"].map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-bold">Chord (optional)<input className={`${fieldClass} mt-1`} value={harmonyChord} onChange={(event) => setHarmonyChord(event.target.value)} placeholder="Example: Am7" /></label><label className="text-sm font-bold">Interval<select className={`${fieldClass} mt-1`} value={harmonyInterval} onChange={(event) => setHarmonyInterval(event.target.value as TimelineDawVerbalHarmonyContext["interval"])}><option value="third">third</option><option value="fifth">fifth</option></select></label><label className="text-sm font-bold">Direction<select className={`${fieldClass} mt-1`} value={harmonyDirection} onChange={(event) => setHarmonyDirection(event.target.value as TimelineDawVerbalHarmonyContext["direction"])}><option value="above">above</option><option value="below">below</option></select></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setHarmonyContext(createTimelineDawHarmonyContext({ tonic: harmonyTonic, scale: harmonyScale, chord: harmonyChord, interval: harmonyInterval, direction: harmonyDirection })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Harmony context could not be prepared."); } }}>Hold harmony context for review</button>{harmonyContext ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p>Plan: a {harmonyContext.interval} {harmonyContext.direction}, referenced to <b>{harmonyContext.tonic} {harmonyContext.scale}</b>{harmonyContext.chord ? ` and confirmed chord ${harmonyContext.chord}` : ""}.</p>{harmonyContext.ambiguities.map((warning) => <p className="mt-2 font-bold text-amber-100" key={warning}>{warning}</p>)}<p className="mt-2 font-bold text-emerald-200">Context held for review. No notes or audio have changed.</p></div> : null}</article> : null}
      {harmonyContext && trackSelection?.selectedTrackId ? <article className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.05] p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-200">Selected-material harmony</p><h3 className="mt-1 text-lg font-black">Prepare the nondestructive note recipe</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-bold">Start tick<input type="number" min={0} step={1} className={`${fieldClass} mt-1`} value={harmonyStartTick} onChange={(event) => setHarmonyStartTick(Number(event.target.value))} /></label><label className="text-sm font-bold">End tick<input type="number" min={1} step={1} className={`${fieldClass} mt-1`} value={harmonyEndTick} onChange={(event) => setHarmonyEndTick(Number(event.target.value))} /></label></div><button type="button" className={`${buttonClass} mt-3`} onClick={() => { try { setHarmonyRecipe(createTimelineDawHarmonyRecipe({ context: harmonyContext, tracks: sessionTracks, sourceTrackId: trackSelection.selectedTrackId, startTick: harmonyStartTick, endTick: harmonyEndTick })); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Harmony recipe could not be prepared."); } }}>Prepare harmony-note recipe</button>{harmonyRecipe ? <div className="mt-3 rounded-xl border border-white/15 p-3 text-sm text-white/70"><p><b>{harmonyRecipe.outputLaneName}</b></p><p className="mt-1">Ticks {harmonyRecipe.startTick}–{harmonyRecipe.endTick}: derive a {harmonyRecipe.interval} {harmonyRecipe.direction} using {harmonyRecipe.tonalReference}; preserve the source rhythm.</p><p className="mt-2 font-bold text-amber-100">Held for note review. The source and arrangement remain unchanged; no MIDI or audio has been rendered.</p></div> : null}</article> : null}
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
