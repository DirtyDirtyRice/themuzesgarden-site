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
