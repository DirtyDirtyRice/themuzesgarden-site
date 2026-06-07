import type {
  MultiTrackAiPromptCategory,
  MultiTrackAiPromptConfidenceLevel,
  MultiTrackAiPromptInputRequirement,
  MultiTrackAiPromptOutputTarget,
  MultiTrackAiPromptReadinessStatus,
  MultiTrackAiPromptTemplate,
  MultiTrackAiPromptWorkspaceState,
} from "./MultiTrackAiPromptWorkspaceTypes";

export function getMultiTrackAiPromptStatusLabel(status: MultiTrackAiPromptReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackAiPromptConfidenceLabel(confidence: MultiTrackAiPromptConfidenceLevel): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "medium") return "Medium Confidence";
  if (confidence === "low") return "Low Confidence";
  return "Manual Required";
}

export function getMultiTrackAiPromptCategoryLabel(category: MultiTrackAiPromptCategory): string {
  if (category === "song-description") return "Song Description";
  if (category === "style-direction") return "Style Direction";
  if (category === "hybrid-instruction") return "Hybrid Instruction";
  if (category === "arrangement-instruction") return "Arrangement Instruction";
  if (category === "stem-instruction") return "Stem Instruction";
  if (category === "hook-instruction") return "Hook Instruction";
  if (category === "lineage-question") return "Lineage Question";
  if (category === "training-feedback") return "Training Feedback";
  if (category === "safety-rule") return "Safety Rule";
  return "Export Note";
}

export function getMultiTrackAiPromptStatusClass(status: MultiTrackAiPromptReadinessStatus): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

export function getMultiTrackAiPromptConfidenceClass(confidence: MultiTrackAiPromptConfidenceLevel): string {
  if (confidence === "high") return "border-white/30 text-white";
  if (confidence === "medium") return "border-white/20 text-white/80";
  if (confidence === "low") return "border-white/15 text-white/60";
  return "border-white/25 text-white";
}

export function countMultiTrackAiPromptStatus(
  items: { status: MultiTrackAiPromptReadinessStatus }[],
  status: MultiTrackAiPromptReadinessStatus,
): number {
  return items.filter((item) => item.status === status).length;
}

export function getMultiTrackAiPromptWorkspaceSummary(state: MultiTrackAiPromptWorkspaceState): {
  ready: number;
  needsReview: number;
  blocked: number;
  future: number;
  total: number;
} {
  const items = [
    ...state.templates,
    ...state.inputRequirements,
    ...state.outputTargets,
    ...state.guardrails,
    ...state.workflowSteps,
  ];

  return {
    ready: countMultiTrackAiPromptStatus(items, "ready"),
    needsReview: countMultiTrackAiPromptStatus(items, "needs-review"),
    blocked: countMultiTrackAiPromptStatus(items, "blocked"),
    future: countMultiTrackAiPromptStatus(items, "future"),
    total: items.length,
  };
}

export function getMultiTrackAiPromptTemplatesByCategory(
  templates: MultiTrackAiPromptTemplate[],
  category: MultiTrackAiPromptCategory,
): MultiTrackAiPromptTemplate[] {
  return templates.filter((template) => template.category === category);
}

export function getMultiTrackAiPromptReadyTemplates(
  templates: MultiTrackAiPromptTemplate[],
): MultiTrackAiPromptTemplate[] {
  return templates.filter((template) => template.status === "ready");
}

export function getMultiTrackAiPromptReviewTemplates(
  templates: MultiTrackAiPromptTemplate[],
): MultiTrackAiPromptTemplate[] {
  return templates.filter((template) => template.status === "needs-review");
}

export function getMultiTrackAiPromptFutureTemplates(
  templates: MultiTrackAiPromptTemplate[],
): MultiTrackAiPromptTemplate[] {
  return templates.filter((template) => template.status === "future");
}

export function getMultiTrackAiPromptManualInputs(
  inputs: MultiTrackAiPromptInputRequirement[],
): MultiTrackAiPromptInputRequirement[] {
  return inputs.filter((input) => input.confidence === "manual-required" || input.status === "needs-review");
}

export function getMultiTrackAiPromptFutureOutputs(
  outputs: MultiTrackAiPromptOutputTarget[],
): MultiTrackAiPromptOutputTarget[] {
  return outputs.filter((output) => output.status === "future");
}

export function buildMultiTrackAiPromptPlanningSentence(state: MultiTrackAiPromptWorkspaceState): string {
  const summary = getMultiTrackAiPromptWorkspaceSummary(state);
  return `${summary.ready} ready item(s), ${summary.needsReview} review item(s), ${summary.future} future item(s), and ${summary.blocked} blocked item(s).`;
}

export function buildMultiTrackAiPromptCategoryCounts(templates: MultiTrackAiPromptTemplate[]): {
  songDescription: number;
  styleDirection: number;
  hybridInstruction: number;
  arrangementInstruction: number;
  stemInstruction: number;
  hookInstruction: number;
  lineageQuestion: number;
  trainingFeedback: number;
  safetyRule: number;
  exportNote: number;
} {
  return {
    songDescription: getMultiTrackAiPromptTemplatesByCategory(templates, "song-description").length,
    styleDirection: getMultiTrackAiPromptTemplatesByCategory(templates, "style-direction").length,
    hybridInstruction: getMultiTrackAiPromptTemplatesByCategory(templates, "hybrid-instruction").length,
    arrangementInstruction: getMultiTrackAiPromptTemplatesByCategory(templates, "arrangement-instruction").length,
    stemInstruction: getMultiTrackAiPromptTemplatesByCategory(templates, "stem-instruction").length,
    hookInstruction: getMultiTrackAiPromptTemplatesByCategory(templates, "hook-instruction").length,
    lineageQuestion: getMultiTrackAiPromptTemplatesByCategory(templates, "lineage-question").length,
    trainingFeedback: getMultiTrackAiPromptTemplatesByCategory(templates, "training-feedback").length,
    safetyRule: getMultiTrackAiPromptTemplatesByCategory(templates, "safety-rule").length,
    exportNote: getMultiTrackAiPromptTemplatesByCategory(templates, "export-note").length,
  };
}

export function buildMultiTrackAiPromptSafetySummary(): string[] {
  return [
    "Read-only prompt planning.",
    "No prompt export yet.",
    "No engine state.",
    "No DSP.",
    "No audio processing.",
    "No save or Supabase writes.",
    "No duplicate track state.",
    "No invented BPM, key, stems, or lineage.",
    "User approves meaning before AI output is trusted.",
  ];
}