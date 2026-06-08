import type {
  MultiTrackFutureHybridBuilderCandidate,
  MultiTrackFutureHybridBuilderEvidenceSource,
  MultiTrackFutureHybridBuilderLane,
  MultiTrackFutureHybridBuilderOutputTarget,
  MultiTrackFutureHybridBuilderReadinessStatus,
  MultiTrackFutureHybridBuilderRecipeStep,
  MultiTrackFutureHybridBuilderRecipeType,
  MultiTrackFutureHybridBuilderRisk,
  MultiTrackFutureHybridBuilderSourceRole,
  MultiTrackFutureHybridBuilderWorkspaceState,
} from "./MultiTrackFutureHybridBuilderTypes";

export function getMultiTrackFutureHybridBuilderStatusLabel(
  status: MultiTrackFutureHybridBuilderReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackFutureHybridBuilderStatusClass(
  status: MultiTrackFutureHybridBuilderReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackFutureHybridBuilderSourceRoleLabel(
  sourceRole: MultiTrackFutureHybridBuilderSourceRole,
): string {
  if (sourceRole === "track-a") return "Track A";
  if (sourceRole === "track-b") return "Track B";
  if (sourceRole === "reference") return "Reference";
  if (sourceRole === "stem-source") return "Stem Source";
  if (sourceRole === "section-source") return "Section Source";
  if (sourceRole === "lineage-source") return "Lineage Source";
  if (sourceRole === "arrangement-source") return "Arrangement Source";
  return "Future AI Source";
}

export function getMultiTrackFutureHybridBuilderRecipeTypeLabel(
  recipeType: MultiTrackFutureHybridBuilderRecipeType,
): string {
  if (recipeType === "section-blend") return "Section Blend";
  if (recipeType === "stem-blend") return "Stem Blend";
  if (recipeType === "tempo-key-blend") return "Tempo / Key Blend";
  if (recipeType === "arrangement-remap") return "Arrangement Remap";
  if (recipeType === "lineage-inspired") return "Lineage Inspired";
  if (recipeType === "suno-prompt-plan") return "Suno Prompt Plan";
  if (recipeType === "third-song-plan") return "Third Song Plan";
  return "Future AI Build";
}

export function getMultiTrackFutureHybridBuilderEvidenceSourceLabel(
  evidenceSource: MultiTrackFutureHybridBuilderEvidenceSource,
): string {
  if (evidenceSource === "compatibility") return "Compatibility";
  if (evidenceSource === "section") return "Section";
  if (evidenceSource === "arrangement") return "Arrangement";
  if (evidenceSource === "lineage") return "Lineage";
  if (evidenceSource === "stem-ownership") return "Stem Ownership";
  if (evidenceSource === "dsp-ownership") return "DSP Ownership";
  if (evidenceSource === "comparison") return "Comparison";
  if (evidenceSource === "confidence") return "Confidence";
  if (evidenceSource === "ai-prompt") return "AI Prompt";
  if (evidenceSource === "manual-review") return "Manual Review";
  return "Future AI";
}

export function getMultiTrackFutureHybridBuilderOutputTargetLabel(
  outputTarget: MultiTrackFutureHybridBuilderOutputTarget,
): string {
  if (outputTarget === "review-notes") return "Review Notes";
  if (outputTarget === "suno-prompt") return "Suno Prompt";
  if (outputTarget === "hybrid-arrangement") return "Hybrid Arrangement";
  if (outputTarget === "stem-plan") return "Stem Plan";
  if (outputTarget === "mix-plan") return "Mix Plan";
  if (outputTarget === "metadata-plan") return "Metadata Plan";
  if (outputTarget === "future-render") return "Future Render";
  return "Future AI Output";
}

export function getMultiTrackFutureHybridBuilderRiskLabel(
  risk: MultiTrackFutureHybridBuilderRisk,
): string {
  if (risk === "missing-track-a") return "Missing Track A";
  if (risk === "missing-track-b") return "Missing Track B";
  if (risk === "missing-compatibility") return "Missing Compatibility";
  if (risk === "missing-confidence") return "Missing Confidence";
  if (risk === "missing-section-map") return "Missing Section Map";
  if (risk === "missing-stem-map") return "Missing Stem Map";
  if (risk === "missing-key-map") return "Missing Key Map";
  if (risk === "missing-lineage") return "Missing Lineage";
  if (risk === "manual-review-required") return "Manual Review Required";
  return "Future Only";
}

export function getMultiTrackFutureHybridBuilderCandidateById(
  candidates: MultiTrackFutureHybridBuilderCandidate[],
  candidateId: string,
): MultiTrackFutureHybridBuilderCandidate | undefined {
  return candidates.find((candidate) => candidate.id === candidateId);
}

export function getMultiTrackFutureHybridBuilderRecipeStepById(
  recipeSteps: MultiTrackFutureHybridBuilderRecipeStep[],
  recipeStepId: string,
): MultiTrackFutureHybridBuilderRecipeStep | undefined {
  return recipeSteps.find((recipeStep) => recipeStep.id === recipeStepId);
}

export function getMultiTrackFutureHybridBuilderLaneCandidates(
  lane: MultiTrackFutureHybridBuilderLane,
  candidates: MultiTrackFutureHybridBuilderCandidate[],
): MultiTrackFutureHybridBuilderCandidate[] {
  return lane.candidateIds
    .map((candidateId) =>
      getMultiTrackFutureHybridBuilderCandidateById(candidates, candidateId),
    )
    .filter(
      (candidate): candidate is MultiTrackFutureHybridBuilderCandidate =>
        Boolean(candidate),
    );
}

export function getMultiTrackFutureHybridBuilderLaneRecipeSteps(
  lane: MultiTrackFutureHybridBuilderLane,
  recipeSteps: MultiTrackFutureHybridBuilderRecipeStep[],
): MultiTrackFutureHybridBuilderRecipeStep[] {
  return lane.recipeStepIds
    .map((recipeStepId) =>
      getMultiTrackFutureHybridBuilderRecipeStepById(recipeSteps, recipeStepId),
    )
    .filter(
      (recipeStep): recipeStep is MultiTrackFutureHybridBuilderRecipeStep =>
        Boolean(recipeStep),
    );
}

export function getMultiTrackFutureHybridBuilderRecipeStepCandidates(
  recipeStep: MultiTrackFutureHybridBuilderRecipeStep,
  candidates: MultiTrackFutureHybridBuilderCandidate[],
): MultiTrackFutureHybridBuilderCandidate[] {
  return recipeStep.candidateIds
    .map((candidateId) =>
      getMultiTrackFutureHybridBuilderCandidateById(candidates, candidateId),
    )
    .filter(
      (candidate): candidate is MultiTrackFutureHybridBuilderCandidate =>
        Boolean(candidate),
    );
}

export function getMultiTrackFutureHybridBuilderRiskSummary(
  risks: MultiTrackFutureHybridBuilderRisk[],
): string {
  if (risks.length === 0) return "No risks listed.";
  return risks.map(getMultiTrackFutureHybridBuilderRiskLabel).join(", ");
}

export function getMultiTrackFutureHybridBuilderEvidenceSummary(
  evidenceSources: MultiTrackFutureHybridBuilderEvidenceSource[],
): string {
  if (evidenceSources.length === 0) return "No evidence listed.";
  return evidenceSources
    .map(getMultiTrackFutureHybridBuilderEvidenceSourceLabel)
    .join(", ");
}

export function getMultiTrackFutureHybridBuilderOutputTargetSummary(
  outputTargets: MultiTrackFutureHybridBuilderOutputTarget[],
): string {
  if (outputTargets.length === 0) return "No output targets listed.";
  return outputTargets
    .map(getMultiTrackFutureHybridBuilderOutputTargetLabel)
    .join(", ");
}

export function getMultiTrackFutureHybridBuilderReadyCandidateCount(
  candidates: MultiTrackFutureHybridBuilderCandidate[],
): number {
  return candidates.filter((candidate) => candidate.readinessStatus === "ready")
    .length;
}

export function getMultiTrackFutureHybridBuilderReviewCandidateCount(
  candidates: MultiTrackFutureHybridBuilderCandidate[],
): number {
  return candidates.filter(
    (candidate) => candidate.readinessStatus === "needs-review",
  ).length;
}

export function getMultiTrackFutureHybridBuilderReadyRecipeStepCount(
  recipeSteps: MultiTrackFutureHybridBuilderRecipeStep[],
): number {
  return recipeSteps.filter((recipeStep) => recipeStep.readinessStatus === "ready")
    .length;
}

export function getMultiTrackFutureHybridBuilderFutureCount(
  workspace: MultiTrackFutureHybridBuilderWorkspaceState,
): number {
  const futureCandidates = workspace.candidates.filter(
    (candidate) => candidate.readinessStatus === "future",
  ).length;
  const futureRecipeSteps = workspace.recipeSteps.filter(
    (recipeStep) => recipeStep.readinessStatus === "future",
  ).length;
  const futureLanes = workspace.lanes.filter((lane) => lane.status === "future")
    .length;

  return futureCandidates + futureRecipeSteps + futureLanes;
}

export function getMultiTrackFutureHybridBuilderWorkspaceSummary(
  workspace: MultiTrackFutureHybridBuilderWorkspaceState,
): string {
  const readyCandidates = getMultiTrackFutureHybridBuilderReadyCandidateCount(
    workspace.candidates,
  );
  const reviewCandidates = getMultiTrackFutureHybridBuilderReviewCandidateCount(
    workspace.candidates,
  );
  const readyRecipeSteps = getMultiTrackFutureHybridBuilderReadyRecipeStepCount(
    workspace.recipeSteps,
  );
  const futureItems = getMultiTrackFutureHybridBuilderFutureCount(workspace);

  return `${readyCandidates} ready candidates, ${reviewCandidates} review candidates, ${readyRecipeSteps} ready recipe steps, and ${futureItems} future items.`;
}