import type {
  MultiTrackEngineDecisionRoute,
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineState,
} from "./multiTrackEngineTypes";

export function getRecommendedDecisionRoute(state: MultiTrackEngineState): MultiTrackEngineDecisionRoute {
  if (state.trackA.sourceKind === "empty") return "inspect-track-a";
  if (state.trackB.sourceKind === "empty") return "inspect-track-b";
  if (!state.trackA.analysisReady || !state.trackB.analysisReady) return "analyze";
  if (!state.trackA.syncReady || !state.trackB.syncReady) return "sync";
  if (state.comparison.weightedScore >= 80) return "save";
  if (state.comparison.weightedScore >= 60) return "compare";
  return "compare";
}

export function getDecisionReason(route: MultiTrackEngineDecisionRoute): string {
  switch (route) {
    case "inspect-track-a":
      return "Track A needs a source before comparison can begin.";
    case "inspect-track-b":
      return "Track B needs a source before comparison can begin.";
    case "compare":
      return "Both tracks need richer comparison signals before saving.";
    case "sync":
      return "Tracks are loaded and analyzed, but sync readiness is not complete.";
    case "analyze":
      return "Tracks are loaded, but analysis readiness is not complete.";
    case "save":
      return "The engine has enough readiness to save a comparison snapshot.";
    case "export":
      return "The engine is ready for a future export path.";
    case "hold":
    default:
      return "The engine is waiting for the next safe action.";
  }
}

export function getNextStepLabel(route: MultiTrackEngineDecisionRoute): string {
  switch (route) {
    case "inspect-track-a":
      return "Load or inspect Track A";
    case "inspect-track-b":
      return "Load or inspect Track B";
    case "analyze":
      return "Run analysis readiness";
    case "sync":
      return "Prepare sync markers";
    case "compare":
      return "Compare track relationship";
    case "save":
      return "Save engine snapshot";
    case "export":
      return "Prepare export";
    case "hold":
    default:
      return "Hold";
  }
}

export function getComparisonSummary(
  engineReadiness: MultiTrackEngineReadinessLevel,
  weightedScore: number,
): string {
  if (engineReadiness === "empty") return "Load Track A and Track B to begin comparison.";
  if (weightedScore >= 80) return "Comparison foundation is strong enough for saving.";
  if (weightedScore >= 60) return "Comparison foundation is usable but still needs verification.";
  if (weightedScore >= 30) return "Comparison foundation has partial data.";
  return "Comparison is waiting for track, waveform, metadata, and analysis readiness.";
}