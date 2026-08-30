export const TIMELINE_DAW_VERBAL_EDIT_SCOPES = [
  { id: "whole-song", label: "Whole song" },
  { id: "section", label: "Verse, chorus, bridge, or other section" },
  { id: "track", label: "One or more tracks or instruments" },
  { id: "phrase", label: "Phrase, riff, chord, or drum pattern" },
  { id: "notes", label: "Individual notes" },
] as const;

export type TimelineDawVerbalEditScope = typeof TIMELINE_DAW_VERBAL_EDIT_SCOPES[number]["id"];

export type TimelineDawVerbalEditRequest = {
  instruction: string;
  scope: TimelineDawVerbalEditScope;
  preserveSources: true;
};

export type TimelineDawProtectedEditPlan = {
  status: "held-for-review";
  target: string;
  interpretation: string;
  steps: readonly string[];
  questions: readonly string[];
  protections: readonly string[];
  executionAllowed: false;
};

export type TimelineDawVerbalPlanDecision = {
  status: "approved" | "rejected" | "revision-requested";
  explanation: string;
  executionAllowed: false;
};

export type TimelineDawVerbalDraftRevision = {
  id: string;
  label: string;
  sourceId: string;
  parentRevisionId: string | null;
  kind: "immutable-source" | "protected-draft";
  instruction: string;
  sourceMutable: false;
};

export type TimelineDawVerbalRevisionHistory = {
  revisions: readonly TimelineDawVerbalDraftRevision[];
  activeIndex: number;
};

export type TimelineDawVerbalNamedSection = {
  id: string;
  name: string;
  startTick: number;
  endTick: number;
};

export type TimelineDawVerbalSectionRecognition = {
  sections: readonly TimelineDawVerbalNamedSection[];
  recognizedSectionIds: readonly string[];
  selectedSectionId: string | null;
  confidence: "exact" | "ambiguous" | "unmatched";
};

export type TimelineDawVerbalSectionOperation = "add" | "remove" | "move" | "copy" | "extend";

export type TimelineDawVerbalSectionRecipe = {
  operation: TimelineDawVerbalSectionOperation;
  sourceSectionId: string | null;
  destinationSectionId: string | null;
  before: readonly TimelineDawVerbalNamedSection[];
  after: readonly (TimelineDawVerbalNamedSection & { sourceSectionId: string | null })[];
  executionAllowed: false;
};

export type TimelineDawGeneratedSectionPlan = {
  sectionType: "verse" | "chorus" | "bridge";
  name: string;
  bars: number;
  beatsPerBar: number;
  ticksPerBeat: number;
  durationTicks: number;
  prompt: string;
  placementAfterSectionId: string | null;
  placementStartTick: number;
  requiredProvenance: readonly ["provider", "model", "request-id", "rights-record", "output-fingerprint"];
  status: "held-for-generation-provider";
  executionAllowed: false;
};

export type TimelineDawGeneratedTransitionPlan = {
  generatedSectionName: string;
  entryFromSectionId: string | null;
  exitToSectionId: string | null;
  style: "clean-cut" | "crossfade" | "pickup" | "tail-overlap";
  crossfadeTicks: number;
  preservePickup: boolean;
  preserveTail: boolean;
  tempoCompatibility: "confirmed" | "review-required";
  keyCompatibility: "confirmed" | "review-required";
  warnings: readonly string[];
  status: "held-for-transition-review";
  executionAllowed: false;
};

export type TimelineDawVerbalTrackCandidate = { id: string; name: string; kind: "audio" | "midi" | "instrument" };
export type TimelineDawVerbalTrackMatch = TimelineDawVerbalTrackCandidate & { score: number; matchedTerms: readonly string[] };
export type TimelineDawVerbalTrackSelection = {
  matches: readonly TimelineDawVerbalTrackMatch[];
  selectedTrackId: string | null;
  confidence: "exact" | "high" | "ambiguous" | "unmatched";
  executionAllowed: false;
};

export type TimelineDawVerbalPerformanceLayerPlan = {
  sourceTrackId: string;
  sourceTrackName: string;
  operation: "double" | "triple";
  addedLayerCount: 1 | 2;
  layerNames: readonly string[];
  placement: "same-timeline-position";
  timingPolicy: "source-locked-pending-humanize-review";
  sourceMutable: false;
  status: "held-for-layer-review";
  executionAllowed: false;
};

export type TimelineDawVerbalHarmonyContext = {
  tonic: string;
  scale: "major" | "minor" | "dorian" | "mixolydian" | "chromatic";
  chord: string | null;
  interval: "third" | "fifth";
  direction: "above" | "below";
  reference: "tonic-and-scale" | "confirmed-chord";
  ambiguities: readonly string[];
  status: "held-for-harmony-context-review";
  executionAllowed: false;
};

export type TimelineDawVerbalHarmonyRecipe = {
  sourceTrackId: string;
  sourceTrackName: string;
  startTick: number;
  endTick: number;
  interval: TimelineDawVerbalHarmonyContext["interval"];
  direction: TimelineDawVerbalHarmonyContext["direction"];
  tonalReference: string;
  notePolicy: "diatonic-scale" | "confirmed-chord-tones";
  outputLaneName: string;
  preserveRhythm: true;
  preserveSource: true;
  status: "held-for-harmony-note-review";
  executionAllowed: false;
};

export type TimelineDawVerbalInstrumentRangePlan = {
  sourceTrackId: string;
  sourceTrackName: string;
  targetInstrument: string;
  rangeSource: "named-section" | "exact-ticks";
  sectionId: string | null;
  sectionName: string | null;
  startTick: number;
  endTick: number;
  entryCrossfadeTicks: number;
  exitCrossfadeTicks: number;
  outsideRangePolicy: "original-instrument-only";
  preserveSource: true;
  status: "held-for-instrument-range-review";
  executionAllowed: false;
};

export type TimelineDawVerbalMicroEditRecipe = {
  sourceTrackId: string;
  sourceTrackName: string;
  targetKind: "phrase" | "riff" | "chord" | "note";
  targetLabel: string;
  startTick: number;
  endTick: number;
  operation: "move" | "repeat" | "replace" | "transpose" | "trim" | "quantize";
  instruction: string;
  precision: "range-confirmed";
  sourceMutable: false;
  createsDraftRevision: true;
  status: "held-for-micro-edit-review";
  executionAllowed: false;
};

export type TimelineDawVerbalMidiNoteDraft = {
  sourceTrackId: string;
  sourceTrackName: string;
  operation: "add" | "update" | "remove";
  midiNote: number;
  noteName: string;
  startTick: number;
  durationTicks: number;
  endTick: number;
  velocity: number;
  channel: number;
  outputLaneName: string;
  sourceMutable: false;
  status: "held-for-midi-note-review";
  executionAllowed: false;
};

export type TimelineDawVerbalNoteAnalysisAssessment = {
  sourceTrackId: string;
  sourceTrackName: string;
  analysisMode: "pitch-and-onset" | "audio-to-midi";
  texture: "monophonic" | "polyphonic" | "percussive";
  detectedNoteCount: number;
  pitchConfidence: number;
  onsetConfidence: number;
  reliability: "high" | "review-required" | "unsupported";
  midiDraftAllowed: boolean;
  warnings: readonly string[];
  humanVerificationRequired: true;
  status: "held-for-analysis-review";
  executionAllowed: false;
};

export type TimelineDawVerbalPrivateRenderPlan = {
  sourceTrackId: string;
  sourceTrackName: string;
  draftKind: "protected-audio-draft" | "midi-bounce-draft" | "generated-section-draft";
  startTick: number;
  endTick: number;
  format: "wav";
  bitDepth: 24 | 32;
  sampleRate: 48_000;
  channels: 2;
  renderDestination: "timeline-daw-renders";
  auditionAccess: "owner-signed-expiring-url";
  sourceMutable: false;
  publishAllowed: false;
  replaceSourceAllowed: false;
  promotionAllowed: false;
  status: "ready-for-protected-render-engine";
  executionAllowed: false;
};

export type TimelineDawVerbalAdCapturePlan = {
  interfaceName: string;
  inputChannel: number;
  sourceType: "microphone" | "instrument" | "line";
  connectionConfirmedByHuman: true;
  sampleRate: 44_100 | 48_000 | 96_000;
  bitDepth: 24 | 32;
  phases: readonly [
    "connect-source-to-interface-input",
    "verify-permission-clock-and-input-level",
    "capture-private-wav-to-new-take",
  ];
  inputLevelTarget: "peaks-between-minus-18-and-minus-6-dbfs";
  sourceMutable: false;
  captureDestination: "new-private-recording-take";
  status: "held-for-live-signal-verification";
  executionAllowed: false;
};

export type TimelineDawVerbalDaMonitoringPlan = {
  interfaceName: string;
  outputName: string;
  destination: "headphones" | "studio-monitors";
  sampleRate: 44_100 | 48_000 | 96_000;
  lowLevelConfirmedByHuman: true;
  phases: readonly ["route-private-audition-to-interface", "confirm-low-output-level", "play-and-verify-left-right-monitoring"];
  sourceMutable: false;
  auditionOnly: true;
  status: "held-for-output-path-verification";
  executionAllowed: false;
};

function normalizeInstruction(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function parseTimelineDawVerbalEditRequest(value: unknown): TimelineDawVerbalEditRequest {
  if (!value || typeof value !== "object") throw new Error("Describe the musical edit you want.");
  const input = value as Record<string, unknown>;
  const instruction = normalizeInstruction(input.instruction);
  if (instruction.length < 10) throw new Error("Describe the musical edit in at least 10 characters.");
  if (instruction.length > 4_000) throw new Error("Keep this edit request under 4,000 characters.");
  const scope = typeof input.scope === "string" && TIMELINE_DAW_VERBAL_EDIT_SCOPES.some((item) => item.id === input.scope)
    ? input.scope as TimelineDawVerbalEditScope
    : null;
  if (!scope) throw new Error("Choose which part of the music this request should affect.");
  if (input.preserveSources !== true) throw new Error("Source preservation must remain on for verbal editing.");
  return { instruction, scope, preserveSources: true };
}

export function summarizeTimelineDawVerbalEditRequest(request: TimelineDawVerbalEditRequest) {
  const scope = TIMELINE_DAW_VERBAL_EDIT_SCOPES.find((item) => item.id === request.scope);
  return {
    scopeLabel: scope?.label ?? "Music",
    instruction: request.instruction,
    safetyLabel: "Original recordings and approved edits stay unchanged.",
  };
}

export function createTimelineDawProtectedEditPlan(request: TimelineDawVerbalEditRequest): TimelineDawProtectedEditPlan {
  const summary = summarizeTimelineDawVerbalEditRequest(request);
  const scopeSteps: Record<TimelineDawVerbalEditScope, string> = {
    "whole-song": "Map the complete arrangement and identify every section affected by the request.",
    section: "Find the requested song section and confirm its exact start and end boundaries.",
    track: "Identify the intended tracks or instruments without changing their current routing.",
    phrase: "Locate the intended phrase, riff, chord, or drum pattern and confirm its exact range.",
    notes: "Identify the intended notes, pitches, and timing positions before proposing note changes.",
  };
  const questions = request.scope === "whole-song"
    ? ["Which existing parts must remain exactly as they are?"]
    : ["Which exact occurrence or time range should this affect?"];
  return {
    status: "held-for-review",
    target: summary.scopeLabel,
    interpretation: request.instruction,
    steps: [
      scopeSteps[request.scope],
      "Analyze the relevant tempo, key, timing, tracks, and approved source material.",
      "Build a separate nondestructive draft and prepare a before/after audition.",
      "Stop and show the proposed result; make no music change without musician approval.",
    ],
    questions,
    protections: [
      "Preserve every original recording and approved edit.",
      "Do not overwrite, delete, publish, export, or activate a result automatically.",
      "Keep execution locked while this plan is held for review.",
    ],
    executionAllowed: false,
  };
}

export function decideTimelineDawVerbalEditPlan(input: {
  decision: unknown;
  explanation?: unknown;
}): TimelineDawVerbalPlanDecision {
  const decision = input.decision;
  if (decision !== "approved" && decision !== "rejected" && decision !== "revision-requested") {
    throw new Error("Choose approve, reject, or request revision.");
  }
  const explanation = typeof input.explanation === "string" ? input.explanation.trim().replace(/\s+/g, " ") : "";
  if (explanation.length > 2_000) throw new Error("Keep the plan explanation under 2,000 characters.");
  if (decision !== "approved" && explanation.length < 5) {
    throw new Error("Explain what should be rejected or revised.");
  }
  return {
    status: decision,
    explanation: explanation || "The musician approved this plan for a later protected execution step.",
    executionAllowed: false,
  };
}

function stableSourceId(request: TimelineDawVerbalEditRequest) {
  let hash = 2166136261;
  for (const character of `${request.scope}:${request.instruction}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `verbal-source-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createTimelineDawVerbalRevisionHistory(input: {
  request: TimelineDawVerbalEditRequest;
  decision: TimelineDawVerbalPlanDecision;
}): TimelineDawVerbalRevisionHistory {
  if (input.decision.status !== "approved") {
    throw new Error("Approve the plan before creating a protected draft.");
  }
  const sourceId = stableSourceId(input.request);
  const baseline: TimelineDawVerbalDraftRevision = {
    id: `${sourceId}-baseline`,
    label: "Original source · locked",
    sourceId,
    parentRevisionId: null,
    kind: "immutable-source",
    instruction: "Original music before the verbal edit draft.",
    sourceMutable: false,
  };
  const draft: TimelineDawVerbalDraftRevision = {
    id: `${sourceId}-draft-1`,
    label: "Protected verbal edit draft 1",
    sourceId,
    parentRevisionId: baseline.id,
    kind: "protected-draft",
    instruction: input.request.instruction,
    sourceMutable: false,
  };
  return { revisions: [baseline, draft], activeIndex: 1 };
}

export function moveTimelineDawVerbalRevisionHistory(
  history: TimelineDawVerbalRevisionHistory,
  direction: "undo" | "redo",
): TimelineDawVerbalRevisionHistory {
  if (history.revisions.length === 0) throw new Error("Revision history must retain its protected source.");
  const nextIndex = direction === "undo"
    ? Math.max(0, history.activeIndex - 1)
    : Math.min(history.revisions.length - 1, history.activeIndex + 1);
  return { revisions: history.revisions, activeIndex: nextIndex };
}

export function recognizeTimelineDawVerbalSections(input: {
  instruction: string;
  sections: readonly TimelineDawVerbalNamedSection[];
  selectedSectionId?: string | null;
}): TimelineDawVerbalSectionRecognition {
  const sections = input.sections
    .filter((section) => section.id.trim() && section.name.trim() && Number.isSafeInteger(section.startTick) && Number.isSafeInteger(section.endTick) && section.startTick >= 0 && section.endTick > section.startTick)
    .map((section) => ({ ...section, id: section.id.trim(), name: section.name.trim() }))
    .sort((left, right) => left.startTick - right.startTick || left.name.localeCompare(right.name));
  const instruction = normalizeInstruction(input.instruction).toLocaleLowerCase();
  const recognizedSectionIds = sections
    .filter((section) => instruction.includes(section.name.toLocaleLowerCase()))
    .map((section) => section.id);
  const requestedSelection = typeof input.selectedSectionId === "string" ? input.selectedSectionId : null;
  const selectedSectionId = requestedSelection && sections.some((section) => section.id === requestedSelection)
    ? requestedSelection
    : recognizedSectionIds.length === 1 ? recognizedSectionIds[0] : null;
  return {
    sections,
    recognizedSectionIds,
    selectedSectionId,
    confidence: recognizedSectionIds.length === 1 ? "exact" : recognizedSectionIds.length > 1 ? "ambiguous" : "unmatched",
  };
}

export function createTimelineDawVerbalSectionRecipe(input: {
  operation: TimelineDawVerbalSectionOperation;
  sections: readonly TimelineDawVerbalNamedSection[];
  sourceSectionId?: string | null;
  destinationSectionId?: string | null;
  addedName?: string;
  durationTicks?: number;
}): TimelineDawVerbalSectionRecipe {
  const recognized = recognizeTimelineDawVerbalSections({ instruction: "", sections: input.sections });
  const before = recognized.sections;
  const sourceIndex = before.findIndex((section) => section.id === input.sourceSectionId);
  const destinationIndex = before.findIndex((section) => section.id === input.destinationSectionId);
  if (input.operation !== "add" && sourceIndex < 0) throw new Error("Choose the complete source section.");
  if (input.operation === "move" && destinationIndex < 0) throw new Error("Choose where the section should move.");
  const blocks = before.map((section) => ({ ...section, duration: section.endTick - section.startTick, sourceSectionId: section.id as string | null }));
  if (input.operation === "remove") blocks.splice(sourceIndex, 1);
  if (input.operation === "copy") {
    const source = blocks[sourceIndex];
    blocks.splice(destinationIndex >= 0 ? destinationIndex + 1 : blocks.length, 0, { ...source, id: `${source.id}-copy`, name: `${source.name} Copy`, sourceSectionId: source.sourceSectionId });
  }
  if (input.operation === "move") {
    const [source] = blocks.splice(sourceIndex, 1);
    const destinationAfterRemoval = blocks.findIndex((section) => section.id === input.destinationSectionId);
    blocks.splice(destinationAfterRemoval + 1, 0, source);
  }
  if (input.operation === "extend") {
    const durationTicks = Number(input.durationTicks);
    if (!Number.isSafeInteger(durationTicks) || durationTicks <= 0) throw new Error("Extension length must be a positive whole number of ticks.");
    blocks[sourceIndex].duration += durationTicks;
  }
  if (input.operation === "add") {
    const name = input.addedName?.trim() ?? "";
    const durationTicks = Number(input.durationTicks);
    if (!name || name.length > 120) throw new Error("Name the complete section being added.");
    if (!Number.isSafeInteger(durationTicks) || durationTicks <= 0) throw new Error("Section length must be a positive whole number of ticks.");
    blocks.splice(destinationIndex >= 0 ? destinationIndex + 1 : blocks.length, 0, { id: `verbal-added-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, name, startTick: 0, endTick: durationTicks, duration: durationTicks, sourceSectionId: null });
  }
  let cursor = before[0]?.startTick ?? 0;
  const after = blocks.map(({ duration, ...section }) => {
    const next = { ...section, startTick: cursor, endTick: cursor + duration };
    cursor = next.endTick;
    return next;
  });
  return { operation: input.operation, sourceSectionId: input.sourceSectionId ?? null, destinationSectionId: input.destinationSectionId ?? null, before, after, executionAllowed: false };
}

export function createTimelineDawGeneratedSectionPlan(input: {
  sectionType: unknown;
  bars: unknown;
  beatsPerBar?: unknown;
  ticksPerBeat?: unknown;
  prompt: unknown;
  sections: readonly TimelineDawVerbalNamedSection[];
  placementAfterSectionId?: string | null;
}): TimelineDawGeneratedSectionPlan {
  if (input.sectionType !== "verse" && input.sectionType !== "chorus" && input.sectionType !== "bridge") throw new Error("Choose verse, chorus, or bridge for generation.");
  const bars = Number(input.bars), beatsPerBar = Number(input.beatsPerBar ?? 4), ticksPerBeat = Number(input.ticksPerBeat ?? 960);
  if (!Number.isSafeInteger(bars) || bars < 1 || bars > 128) throw new Error("Generated sections must be from 1 to 128 whole bars.");
  if (!Number.isSafeInteger(beatsPerBar) || beatsPerBar < 1 || beatsPerBar > 32) throw new Error("Beats per bar must be from 1 to 32.");
  if (!Number.isSafeInteger(ticksPerBeat) || ticksPerBeat < 24 || ticksPerBeat > 9600) throw new Error("Ticks per beat are outside the supported musical range.");
  const prompt = normalizeInstruction(input.prompt);
  if (prompt.length < 10) throw new Error("Describe the generated section in at least 10 characters.");
  if (prompt.length > 4_000) throw new Error("Keep the generation request under 4,000 characters.");
  const sections = recognizeTimelineDawVerbalSections({ instruction: "", sections: input.sections }).sections;
  const destination = input.placementAfterSectionId ? sections.find((section) => section.id === input.placementAfterSectionId) : null;
  if (input.placementAfterSectionId && !destination) throw new Error("The placement section was not found.");
  const placementStartTick = destination?.endTick ?? sections.at(-1)?.endTick ?? 0;
  const name = `Generated ${input.sectionType[0].toUpperCase()}${input.sectionType.slice(1)}`;
  return {
    sectionType: input.sectionType, name, bars, beatsPerBar, ticksPerBeat,
    durationTicks: bars * beatsPerBar * ticksPerBeat,
    prompt, placementAfterSectionId: input.placementAfterSectionId ?? null, placementStartTick,
    requiredProvenance: ["provider", "model", "request-id", "rights-record", "output-fingerprint"],
    status: "held-for-generation-provider", executionAllowed: false,
  };
}

export function createTimelineDawGeneratedTransitionPlan(input: {
  generationPlan: TimelineDawGeneratedSectionPlan;
  sections: readonly TimelineDawVerbalNamedSection[];
  style: unknown;
  crossfadeTicks?: unknown;
  preservePickup?: unknown;
  preserveTail?: unknown;
  tempoCompatibility?: unknown;
  keyCompatibility?: unknown;
}): TimelineDawGeneratedTransitionPlan {
  const styles = ["clean-cut", "crossfade", "pickup", "tail-overlap"] as const;
  if (!styles.some((style) => style === input.style)) throw new Error("Choose a supported section transition style.");
  const style = input.style as TimelineDawGeneratedTransitionPlan["style"];
  const sections = recognizeTimelineDawVerbalSections({ instruction: "", sections: input.sections }).sections;
  const entryIndex = input.generationPlan.placementAfterSectionId
    ? sections.findIndex((section) => section.id === input.generationPlan.placementAfterSectionId)
    : sections.length - 1;
  if (input.generationPlan.placementAfterSectionId && entryIndex < 0) throw new Error("The generated section entry boundary no longer exists.");
  const crossfadeTicks = style === "crossfade" || style === "tail-overlap" ? Number(input.crossfadeTicks ?? 0) : 0;
  if (!Number.isSafeInteger(crossfadeTicks) || crossfadeTicks < 0 || crossfadeTicks > input.generationPlan.durationTicks / 2) throw new Error("Crossfade length must be a safe whole-tick range inside the generated section.");
  if ((style === "crossfade" || style === "tail-overlap") && crossfadeTicks === 0) throw new Error("This transition style requires a positive crossfade length.");
  const tempoCompatibility = input.tempoCompatibility === "confirmed" ? "confirmed" : "review-required";
  const keyCompatibility = input.keyCompatibility === "confirmed" ? "confirmed" : "review-required";
  const warnings = [
    ...(tempoCompatibility === "review-required" ? ["Confirm tempo and downbeat alignment before rendering."] : []),
    ...(keyCompatibility === "review-required" ? ["Confirm key or intentional modulation before rendering."] : []),
  ];
  return {
    generatedSectionName: input.generationPlan.name,
    entryFromSectionId: sections[entryIndex]?.id ?? null,
    exitToSectionId: sections[entryIndex + 1]?.id ?? null,
    style, crossfadeTicks,
    preservePickup: input.preservePickup === true || style === "pickup",
    preserveTail: input.preserveTail === true || style === "tail-overlap",
    tempoCompatibility, keyCompatibility, warnings,
    status: "held-for-transition-review", executionAllowed: false,
  };
}

const TRACK_TERM_GROUPS = [
  ["guitar", "gtr", "acoustic", "electric"], ["bass", "bassline"], ["drum", "drums", "kick", "snare", "percussion", "beat"],
  ["vocal", "vocals", "voice", "singer"], ["piano", "keys", "keyboard", "rhodes", "organ", "synth"],
  ["sax", "saxophone"], ["horn", "trumpet", "trombone"], ["strings", "violin", "viola", "cello"],
] as const;

function trackTerms(value: string) {
  const normalized = value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const terms = new Set(normalized.split(" ").filter((term) => term.length > 1));
  for (const group of TRACK_TERM_GROUPS) if (group.some((term) => terms.has(term))) group.forEach((term) => terms.add(term));
  return { normalized, terms };
}

export function matchTimelineDawTracksByDescription(input: {
  description: unknown;
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  selectedTrackId?: string | null;
}): TimelineDawVerbalTrackSelection {
  const description = normalizeInstruction(input.description);
  if (description.length < 2) throw new Error("Describe the instrument or track to select.");
  const query = trackTerms(description);
  const tracks = input.tracks.filter((track) => track.id.trim() && track.name.trim()).map((track) => ({ ...track, id: track.id.trim(), name: track.name.trim() }));
  const matches = tracks.map((track) => {
    const candidate = trackTerms(track.name);
    const matchedTerms = [...query.terms].filter((term) => candidate.terms.has(term));
    const exact = query.normalized === candidate.normalized || query.normalized.includes(candidate.normalized);
    const score = exact ? 100 : Math.min(99, matchedTerms.length * 20 + (matchedTerms.some((term) => track.name.toLocaleLowerCase().includes(term)) ? 10 : 0));
    return { ...track, score, matchedTerms };
  }).filter((track) => track.score > 0).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
  const top = matches[0], tied = top ? matches.filter((match) => match.score === top.score) : [];
  const inferred = top && tied.length === 1 && top.score >= 40 ? top.id : null;
  const requested = input.selectedTrackId && tracks.some((track) => track.id === input.selectedTrackId) ? input.selectedTrackId : null;
  return {
    matches, selectedTrackId: requested ?? inferred,
    confidence: top?.score === 100 && tied.length === 1 ? "exact" : inferred ? "high" : matches.length ? "ambiguous" : "unmatched",
    executionAllowed: false,
  };
}

export function createTimelineDawPerformanceLayerPlan(input: {
  instruction: unknown;
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
}): TimelineDawVerbalPerformanceLayerPlan {
  const instruction = normalizeInstruction(input.instruction).toLocaleLowerCase();
  const operation = /\b(triple|tripled|tripling)\b/.test(instruction) ? "triple" : /\b(double|doubled|doubling)\b/.test(instruction) ? "double" : null;
  if (!operation) throw new Error("Say whether to double or triple the performance.");
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the real source track before planning performance layers.");
  const addedLayerCount = operation === "triple" ? 2 : 1;
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    operation,
    addedLayerCount,
    layerNames: Array.from({ length: addedLayerCount }, (_, index) => `${source.name} ${operation === "double" ? "Double" : "Triple"} ${index + 1}`),
    placement: "same-timeline-position",
    timingPolicy: "source-locked-pending-humanize-review",
    sourceMutable: false,
    status: "held-for-layer-review",
    executionAllowed: false,
  };
}

const VERBAL_MUSIC_TONICS = new Set(["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]);

export function createTimelineDawHarmonyContext(input: {
  tonic: unknown;
  scale: unknown;
  chord?: unknown;
  interval: unknown;
  direction: unknown;
}): TimelineDawVerbalHarmonyContext {
  const tonic = normalizeInstruction(input.tonic).replace(/♯/g, "#").replace(/♭/g, "b");
  if (!VERBAL_MUSIC_TONICS.has(tonic)) throw new Error("Confirm a tonic from C through B, including an optional sharp or flat.");
  const scale = normalizeInstruction(input.scale).toLocaleLowerCase();
  if (!["major", "minor", "dorian", "mixolydian", "chromatic"].includes(scale)) throw new Error("Choose a supported scale or mode.");
  const interval = normalizeInstruction(input.interval).toLocaleLowerCase();
  if (interval !== "third" && interval !== "fifth") throw new Error("Choose a third or fifth for this harmony milestone.");
  const direction = normalizeInstruction(input.direction).toLocaleLowerCase();
  if (direction !== "above" && direction !== "below") throw new Error("Choose whether the harmony sits above or below the source.");
  const chord = normalizeInstruction(input.chord) || null;
  if (chord && chord.length > 32) throw new Error("Keep the confirmed chord name under 33 characters.");
  return {
    tonic,
    scale: scale as TimelineDawVerbalHarmonyContext["scale"],
    chord,
    interval: interval as TimelineDawVerbalHarmonyContext["interval"],
    direction: direction as TimelineDawVerbalHarmonyContext["direction"],
    reference: chord ? "confirmed-chord" : "tonic-and-scale",
    ambiguities: chord ? [] : ["Chord-by-chord harmony remains unconfirmed; use the tonic and scale until chord context is supplied."],
    status: "held-for-harmony-context-review",
    executionAllowed: false,
  };
}

export function createTimelineDawHarmonyRecipe(input: {
  context: TimelineDawVerbalHarmonyContext;
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  startTick: unknown;
  endTick: unknown;
}): TimelineDawVerbalHarmonyRecipe {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the real source track before preparing harmony notes.");
  const startTick = Number(input.startTick);
  const endTick = Number(input.endTick);
  if (!Number.isSafeInteger(startTick) || startTick < 0) throw new Error("Harmony start must be a nonnegative whole timeline tick.");
  if (!Number.isSafeInteger(endTick) || endTick <= startTick) throw new Error("Harmony end must be a whole timeline tick after the start.");
  if (input.context.executionAllowed !== false || input.context.status !== "held-for-harmony-context-review") throw new Error("Harmony context must remain held for review.");
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    startTick,
    endTick,
    interval: input.context.interval,
    direction: input.context.direction,
    tonalReference: input.context.chord ?? `${input.context.tonic} ${input.context.scale}`,
    notePolicy: input.context.chord ? "confirmed-chord-tones" : "diatonic-scale",
    outputLaneName: `${source.name} Harmony ${input.context.interval} ${input.context.direction}`,
    preserveRhythm: true,
    preserveSource: true,
    status: "held-for-harmony-note-review",
    executionAllowed: false,
  };
}

export function createTimelineDawInstrumentRangePlan(input: {
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  targetInstrument: unknown;
  sections: readonly TimelineDawVerbalNamedSection[];
  sectionId?: string | null;
  startTick?: unknown;
  endTick?: unknown;
  crossfadeTicks?: unknown;
}): TimelineDawVerbalInstrumentRangePlan {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the source track before changing its instrument by range.");
  const targetInstrument = normalizeInstruction(input.targetInstrument);
  if (targetInstrument.length < 2 || targetInstrument.length > 100) throw new Error("Name the replacement instrument in 2 to 100 characters.");
  const section = input.sectionId ? input.sections.find((item) => item.id === input.sectionId) : null;
  if (input.sectionId && !section) throw new Error("The selected named section no longer exists.");
  const startTick = section?.startTick ?? Number(input.startTick);
  const endTick = section?.endTick ?? Number(input.endTick);
  if (!Number.isSafeInteger(startTick) || startTick < 0) throw new Error("Instrument-range start must be a nonnegative whole timeline tick.");
  if (!Number.isSafeInteger(endTick) || endTick <= startTick) throw new Error("Instrument-range end must be a whole timeline tick after the start.");
  const crossfadeTicks = Number(input.crossfadeTicks ?? 0);
  if (!Number.isSafeInteger(crossfadeTicks) || crossfadeTicks < 0 || crossfadeTicks * 2 > endTick - startTick) throw new Error("Crossfade must fit safely inside the selected range.");
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    targetInstrument,
    rangeSource: section ? "named-section" : "exact-ticks",
    sectionId: section?.id ?? null,
    sectionName: section?.name ?? null,
    startTick,
    endTick,
    entryCrossfadeTicks: crossfadeTicks,
    exitCrossfadeTicks: crossfadeTicks,
    outsideRangePolicy: "original-instrument-only",
    preserveSource: true,
    status: "held-for-instrument-range-review",
    executionAllowed: false,
  };
}

export function createTimelineDawMicroEditRecipe(input: {
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  targetKind: unknown;
  targetLabel: unknown;
  startTick: unknown;
  endTick: unknown;
  operation: unknown;
  instruction: unknown;
}): TimelineDawVerbalMicroEditRecipe {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the source track before preparing a detailed verbal edit.");
  const targetKind = normalizeInstruction(input.targetKind).toLocaleLowerCase();
  if (!["phrase", "riff", "chord", "note"].includes(targetKind)) throw new Error("Choose phrase, riff, chord, or note as the target.");
  const targetLabel = normalizeInstruction(input.targetLabel);
  if (targetLabel.length < 2 || targetLabel.length > 120) throw new Error("Label the musical target in 2 to 120 characters.");
  const startTick = Number(input.startTick);
  const endTick = Number(input.endTick);
  if (!Number.isSafeInteger(startTick) || startTick < 0) throw new Error("Detailed-edit start must be a nonnegative whole timeline tick.");
  if (!Number.isSafeInteger(endTick) || endTick <= startTick) throw new Error("Detailed-edit end must be a whole timeline tick after the start.");
  const operation = normalizeInstruction(input.operation).toLocaleLowerCase();
  if (!["move", "repeat", "replace", "transpose", "trim", "quantize"].includes(operation)) throw new Error("Choose a supported detailed-edit operation.");
  const instruction = normalizeInstruction(input.instruction);
  if (instruction.length < 10 || instruction.length > 1_000) throw new Error("Describe the detailed edit in 10 to 1,000 characters.");
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    targetKind: targetKind as TimelineDawVerbalMicroEditRecipe["targetKind"],
    targetLabel,
    startTick,
    endTick,
    operation: operation as TimelineDawVerbalMicroEditRecipe["operation"],
    instruction,
    precision: "range-confirmed",
    sourceMutable: false,
    createsDraftRevision: true,
    status: "held-for-micro-edit-review",
    executionAllowed: false,
  };
}

function midiNoteName(midiNote: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midiNote % 12]}${Math.floor(midiNote / 12) - 1}`;
}

export function createTimelineDawMidiNoteDraft(input: {
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  operation: unknown;
  midiNote: unknown;
  startTick: unknown;
  durationTicks: unknown;
  velocity: unknown;
  channel: unknown;
}): TimelineDawVerbalMidiNoteDraft {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the source track before preparing an exact MIDI note.");
  const operation = normalizeInstruction(input.operation).toLocaleLowerCase();
  if (operation !== "add" && operation !== "update" && operation !== "remove") throw new Error("Choose add, update, or remove for the MIDI note.");
  const midiNote = Number(input.midiNote);
  const startTick = Number(input.startTick);
  const durationTicks = Number(input.durationTicks);
  const velocity = Number(input.velocity);
  const channel = Number(input.channel);
  if (!Number.isInteger(midiNote) || midiNote < 0 || midiNote > 127) throw new Error("MIDI pitch must be a whole number from 0 to 127.");
  if (!Number.isSafeInteger(startTick) || startTick < 0) throw new Error("MIDI start must be a nonnegative whole timeline tick.");
  if (!Number.isSafeInteger(durationTicks) || durationTicks < 1) throw new Error("MIDI duration must be at least one whole timeline tick.");
  if (!Number.isInteger(velocity) || velocity < 1 || velocity > 127) throw new Error("MIDI velocity must be a whole number from 1 to 127.");
  if (!Number.isInteger(channel) || channel < 1 || channel > 16) throw new Error("MIDI channel must be a whole number from 1 to 16.");
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    operation,
    midiNote,
    noteName: midiNoteName(midiNote),
    startTick,
    durationTicks,
    endTick: startTick + durationTicks,
    velocity,
    channel,
    outputLaneName: `${source.name} MIDI Draft`,
    sourceMutable: false,
    status: "held-for-midi-note-review",
    executionAllowed: false,
  };
}

export function assessTimelineDawNoteAnalysis(input: {
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  analysisMode: unknown;
  texture: unknown;
  detectedNoteCount: unknown;
  pitchConfidence: unknown;
  onsetConfidence: unknown;
}): TimelineDawVerbalNoteAnalysisAssessment {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the source track before assessing note analysis.");
  const analysisMode = normalizeInstruction(input.analysisMode).toLocaleLowerCase();
  if (analysisMode !== "pitch-and-onset" && analysisMode !== "audio-to-midi") throw new Error("Choose pitch-and-onset or audio-to-MIDI analysis.");
  const texture = normalizeInstruction(input.texture).toLocaleLowerCase();
  if (texture !== "monophonic" && texture !== "polyphonic" && texture !== "percussive") throw new Error("Classify the source as monophonic, polyphonic, or percussive.");
  const detectedNoteCount = Number(input.detectedNoteCount);
  const pitchConfidence = Number(input.pitchConfidence);
  const onsetConfidence = Number(input.onsetConfidence);
  if (!Number.isSafeInteger(detectedNoteCount) || detectedNoteCount < 0 || detectedNoteCount > 100_000) throw new Error("Detected note count must be a whole number from 0 to 100,000.");
  if (!Number.isFinite(pitchConfidence) || pitchConfidence < 0 || pitchConfidence > 1) throw new Error("Pitch confidence must be between 0 and 1.");
  if (!Number.isFinite(onsetConfidence) || onsetConfidence < 0 || onsetConfidence > 1) throw new Error("Onset confidence must be between 0 and 1.");
  const unsupported = texture !== "monophonic" && analysisMode === "audio-to-midi";
  const high = !unsupported && detectedNoteCount > 0 && pitchConfidence >= 0.9 && onsetConfidence >= 0.85;
  const review = !unsupported && detectedNoteCount > 0 && pitchConfidence >= 0.7 && onsetConfidence >= 0.7;
  const reliability = unsupported ? "unsupported" : high ? "high" : review ? "review-required" : "unsupported";
  const warnings = [
    ...(texture === "polyphonic" ? ["Overlapping pitches can produce octave errors, missing notes, or false notes."] : []),
    ...(texture === "percussive" ? ["Percussive audio can support onset timing, but pitched-note conversion is not reliable."] : []),
    ...(pitchConfidence < 0.9 ? ["Pitch confidence is below the high-reliability threshold."] : []),
    ...(onsetConfidence < 0.85 ? ["Onset confidence is below the high-reliability threshold."] : []),
    ...(detectedNoteCount === 0 ? ["No note candidates were detected."] : []),
  ];
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    analysisMode,
    texture,
    detectedNoteCount,
    pitchConfidence,
    onsetConfidence,
    reliability,
    midiDraftAllowed: reliability === "high",
    warnings,
    humanVerificationRequired: true,
    status: "held-for-analysis-review",
    executionAllowed: false,
  };
}

export function createTimelineDawVerbalPrivateRenderPlan(input: {
  tracks: readonly TimelineDawVerbalTrackCandidate[];
  sourceTrackId: string | null;
  draftKind: unknown;
  startTick: unknown;
  endTick: unknown;
  bitDepth: unknown;
}): TimelineDawVerbalPrivateRenderPlan {
  const source = input.sourceTrackId ? input.tracks.find((track) => track.id === input.sourceTrackId) : null;
  if (!source) throw new Error("Confirm the private source track before preparing a render handoff.");
  const draftKind = normalizeInstruction(input.draftKind).toLocaleLowerCase();
  if (!["protected-audio-draft", "midi-bounce-draft", "generated-section-draft"].includes(draftKind)) throw new Error("Choose a supported protected draft to render.");
  const startTick = Number(input.startTick);
  const endTick = Number(input.endTick);
  const bitDepth = Number(input.bitDepth);
  if (!Number.isSafeInteger(startTick) || startTick < 0) throw new Error("Render start must be a nonnegative whole timeline tick.");
  if (!Number.isSafeInteger(endTick) || endTick <= startTick) throw new Error("Render end must be a whole timeline tick after the start.");
  if (bitDepth !== 24 && bitDepth !== 32) throw new Error("Choose 24-bit or 32-bit WAV rendering.");
  return {
    sourceTrackId: source.id,
    sourceTrackName: source.name,
    draftKind: draftKind as TimelineDawVerbalPrivateRenderPlan["draftKind"],
    startTick,
    endTick,
    format: "wav",
    bitDepth,
    sampleRate: 48_000,
    channels: 2,
    renderDestination: "timeline-daw-renders",
    auditionAccess: "owner-signed-expiring-url",
    sourceMutable: false,
    publishAllowed: false,
    replaceSourceAllowed: false,
    promotionAllowed: false,
    status: "ready-for-protected-render-engine",
    executionAllowed: false,
  };
}

export function createTimelineDawVerbalAdCapturePlan(input: {
  interfaceName: unknown;
  inputChannel: unknown;
  sourceType: unknown;
  connectionConfirmedByHuman: unknown;
  sampleRate: unknown;
  bitDepth: unknown;
}): TimelineDawVerbalAdCapturePlan {
  const interfaceName = normalizeInstruction(input.interfaceName);
  if (interfaceName.length < 2 || interfaceName.length > 120) throw new Error("Name the connected audio interface in 2 to 120 characters.");
  const inputChannel = Number(input.inputChannel);
  if (!Number.isSafeInteger(inputChannel) || inputChannel < 1 || inputChannel > 128) throw new Error("Interface input must be a whole channel number from 1 to 128.");
  const sourceType = normalizeInstruction(input.sourceType).toLocaleLowerCase();
  if (!["microphone", "instrument", "line"].includes(sourceType)) throw new Error("Choose microphone, instrument, or line as the analog source.");
  if (input.connectionConfirmedByHuman !== true) throw new Error("A human must confirm the physical source-to-interface connection.");
  const sampleRate = Number(input.sampleRate);
  if (![44_100, 48_000, 96_000].includes(sampleRate)) throw new Error("Choose 44.1, 48, or 96 kHz for A/D capture.");
  const bitDepth = Number(input.bitDepth);
  if (bitDepth !== 24 && bitDepth !== 32) throw new Error("Choose 24-bit or 32-bit A/D capture.");
  return {
    interfaceName,
    inputChannel,
    sourceType: sourceType as TimelineDawVerbalAdCapturePlan["sourceType"],
    connectionConfirmedByHuman: true,
    sampleRate: sampleRate as TimelineDawVerbalAdCapturePlan["sampleRate"],
    bitDepth,
    phases: ["connect-source-to-interface-input", "verify-permission-clock-and-input-level", "capture-private-wav-to-new-take"],
    inputLevelTarget: "peaks-between-minus-18-and-minus-6-dbfs",
    sourceMutable: false,
    captureDestination: "new-private-recording-take",
    status: "held-for-live-signal-verification",
    executionAllowed: false,
  };
}

export function createTimelineDawVerbalDaMonitoringPlan(input: { interfaceName: unknown; outputName: unknown; destination: unknown; sampleRate: unknown; lowLevelConfirmedByHuman: unknown }): TimelineDawVerbalDaMonitoringPlan {
  const interfaceName = normalizeInstruction(input.interfaceName);
  const outputName = normalizeInstruction(input.outputName);
  if (interfaceName.length < 2 || interfaceName.length > 120) throw new Error("Name the connected audio interface in 2 to 120 characters.");
  if (outputName.length < 2 || outputName.length > 120) throw new Error("Name the connected interface output in 2 to 120 characters.");
  const destination = normalizeInstruction(input.destination).toLocaleLowerCase();
  if (destination !== "headphones" && destination !== "studio-monitors") throw new Error("Choose headphones or studio monitors as the listening destination.");
  const sampleRate = Number(input.sampleRate);
  if (![44_100, 48_000, 96_000].includes(sampleRate)) throw new Error("Choose 44.1, 48, or 96 kHz for D/A monitoring.");
  if (input.lowLevelConfirmedByHuman !== true) throw new Error("A human must turn the interface output down before D/A playback.");
  return { interfaceName, outputName, destination: destination as TimelineDawVerbalDaMonitoringPlan["destination"], sampleRate: sampleRate as TimelineDawVerbalDaMonitoringPlan["sampleRate"], lowLevelConfirmedByHuman: true, phases: ["route-private-audition-to-interface", "confirm-low-output-level", "play-and-verify-left-right-monitoring"], sourceMutable: false, auditionOnly: true, status: "held-for-output-path-verification", executionAllowed: false };
}
