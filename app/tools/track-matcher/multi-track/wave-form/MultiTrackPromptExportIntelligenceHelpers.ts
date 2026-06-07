import type {
  MultiTrackPromptExportConfidenceLevel,
  MultiTrackPromptExportFormat,
  MultiTrackPromptExportGate,
  MultiTrackPromptExportOwner,
  MultiTrackPromptExportPlan,
  MultiTrackPromptExportReadinessStatus,
  MultiTrackPromptExportRiskItem,
  MultiTrackPromptExportSource,
  MultiTrackPromptExportTarget,
  MultiTrackPromptExportWorkspaceState,
} from "./MultiTrackPromptExportIntelligenceTypes";

export function getMultiTrackPromptExportStatusLabel(
  status: MultiTrackPromptExportReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackPromptExportConfidenceLabel(
  confidence: MultiTrackPromptExportConfidenceLevel,
): string {
  if (confidence === "high") return "High";
  if (confidence === "medium") return "Medium";
  if (confidence === "low") return "Low";
  return "Manual Required";
}

export function getMultiTrackPromptExportOwnerLabel(
  owner: MultiTrackPromptExportOwner,
): string {
  if (owner === "user") return "User";
  if (owner === "manual-review") return "Manual Review";
  if (owner === "future-ai") return "Future AI";
  if (owner === "future-analyzer") return "Future Analyzer";
  if (owner === "future-exporter") return "Future Exporter";
  return "Future Hybrid Builder";
}

export function getMultiTrackPromptExportSourceLabel(
  source: MultiTrackPromptExportSource,
): string {
  if (source === "track-a") return "Track A";
  if (source === "track-b") return "Track B";
  if (source === "comparison") return "Comparison";
  if (source === "confidence") return "Confidence";
  if (source === "ai-prompt") return "AI Prompt";
  if (source === "hybrid-plan") return "Hybrid Plan";
  if (source === "manual-note") return "Manual Note";
  return "Future Analysis";
}

export function getMultiTrackPromptExportTargetLabel(
  target: MultiTrackPromptExportTarget,
): string {
  if (target === "suno") return "Suno";
  if (target === "project-note") return "Project Note";
  if (target === "library-note") return "Library Note";
  if (target === "hybrid-builder") return "Hybrid Builder";
  if (target === "training-log") return "Training Log";
  if (target === "manual-copy") return "Manual Copy";
  return "Future Export API";
}

export function getMultiTrackPromptExportFormatLabel(
  format: MultiTrackPromptExportFormat,
): string {
  if (format === "plain-text") return "Plain Text";
  if (format === "structured-note") return "Structured Note";
  if (format === "question-list") return "Question List";
  if (format === "safety-summary") return "Safety Summary";
  if (format === "builder-instruction") return "Builder Instruction";
  return "Training Feedback";
}

export function getMultiTrackPromptExportStatusClass(
  status: MultiTrackPromptExportReadinessStatus,
): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

export function getMultiTrackPromptExportConfidenceClass(
  confidence: MultiTrackPromptExportConfidenceLevel,
): string {
  if (confidence === "high") return "border-white/30 text-white";
  if (confidence === "medium") return "border-white/25 text-white/80";
  if (confidence === "low") return "border-white/15 text-white/65";
  return "border-white/20 text-white/75";
}

export function countMultiTrackPromptExportStatus(
  items: { status: MultiTrackPromptExportReadinessStatus }[],
  status: MultiTrackPromptExportReadinessStatus,
): number {
  return items.filter((item) => item.status === status).length;
}

export function getMultiTrackPromptExportWorkspaceSummary(
  state: MultiTrackPromptExportWorkspaceState,
): {
  ready: number;
  needsReview: number;
  blocked: number;
  future: number;
  total: number;
} {
  const allItems = [
    ...state.gates,
    ...state.plans,
    ...state.risks,
    ...state.checklist,
    ...state.previewCards,
  ];

  return {
    ready: countMultiTrackPromptExportStatus(allItems, "ready"),
    needsReview: countMultiTrackPromptExportStatus(allItems, "needs-review"),
    blocked: countMultiTrackPromptExportStatus(allItems, "blocked"),
    future: countMultiTrackPromptExportStatus(allItems, "future"),
    total: allItems.length,
  };
}

export function getMultiTrackPromptExportPlansByTarget(
  plans: MultiTrackPromptExportPlan[],
  target: MultiTrackPromptExportTarget,
): MultiTrackPromptExportPlan[] {
  return plans.filter((plan) => plan.target === target);
}

export function getMultiTrackPromptExportGatesBySource(
  gates: MultiTrackPromptExportGate[],
  source: MultiTrackPromptExportSource,
): MultiTrackPromptExportGate[] {
  return gates.filter((gate) => gate.source === source);
}

export function getMultiTrackPromptExportRisksByOwner(
  risks: MultiTrackPromptExportRiskItem[],
  owner: MultiTrackPromptExportOwner,
): MultiTrackPromptExportRiskItem[] {
  return risks.filter((risk) => risk.owner === owner);
}

export function getMultiTrackPromptExportReadyPlans(
  plans: MultiTrackPromptExportPlan[],
): MultiTrackPromptExportPlan[] {
  return plans.filter((plan) => plan.status === "ready");
}

export function getMultiTrackPromptExportReviewPlans(
  plans: MultiTrackPromptExportPlan[],
): MultiTrackPromptExportPlan[] {
  return plans.filter((plan) => plan.status === "needs-review");
}

export function getMultiTrackPromptExportFuturePlans(
  plans: MultiTrackPromptExportPlan[],
): MultiTrackPromptExportPlan[] {
  return plans.filter((plan) => plan.status === "future");
}

export function buildMultiTrackPromptExportPlanningSentence(
  state: MultiTrackPromptExportWorkspaceState,
): string {
  const summary = getMultiTrackPromptExportWorkspaceSummary(state);

  return `${summary.ready} ready item(s), ${summary.needsReview} review item(s), ${summary.blocked} blocked item(s), ${summary.future} future item(s), ${summary.total} total export planning item(s).`;
}

export function buildMultiTrackPromptExportTargetCounts(
  plans: MultiTrackPromptExportPlan[],
): {
  suno: number;
  projectNote: number;
  libraryNote: number;
  hybridBuilder: number;
  trainingLog: number;
  manualCopy: number;
  futureExportApi: number;
} {
  return {
    suno: getMultiTrackPromptExportPlansByTarget(plans, "suno").length,
    projectNote: getMultiTrackPromptExportPlansByTarget(plans, "project-note").length,
    libraryNote: getMultiTrackPromptExportPlansByTarget(plans, "library-note").length,
    hybridBuilder: getMultiTrackPromptExportPlansByTarget(plans, "hybrid-builder").length,
    trainingLog: getMultiTrackPromptExportPlansByTarget(plans, "training-log").length,
    manualCopy: getMultiTrackPromptExportPlansByTarget(plans, "manual-copy").length,
    futureExportApi: getMultiTrackPromptExportPlansByTarget(plans, "future-export-api").length,
  };
}

export function buildMultiTrackPromptExportSafetySummary(): string[] {
  return [
    "Read-only export planning.",
    "No AI calls.",
    "No Supabase writes.",
    "No audio processing.",
    "No automatic Suno submission.",
    "No automatic project note creation.",
    "No automatic library note creation.",
    "No hybrid builder command.",
    "No invented BPM, key, stem, or lineage claim.",
    "User approves anything that leaves the app.",
  ];
}