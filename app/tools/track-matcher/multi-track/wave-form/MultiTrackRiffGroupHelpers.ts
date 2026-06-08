import type {
  MultiTrackRiffEditPlan,
  MultiTrackRiffExperimentPlan,
  MultiTrackRiffExtractPlan,
  MultiTrackRiffGroup,
  MultiTrackRiffGroupColor,
  MultiTrackRiffGroupRisk,
  MultiTrackRiffGroupStatus,
  MultiTrackRiffGroupWorkspaceState,
  MultiTrackRiffInstance,
} from "./MultiTrackRiffGroupTypes";

export function getMultiTrackRiffGroupStatusLabel(
  status: MultiTrackRiffGroupStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "manual") return "Manual";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackRiffGroupColorLabel(
  color: MultiTrackRiffGroupColor,
): string {
  if (color === "blue") return "Blue";
  if (color === "red") return "Red";
  if (color === "green") return "Green";
  if (color === "yellow") return "Yellow";
  if (color === "purple") return "Purple";
  if (color === "orange") return "Orange";
  if (color === "pink") return "Pink";
  if (color === "cyan") return "Cyan";
  return "White";
}

export function getMultiTrackRiffRiskLabel(risk: MultiTrackRiffGroupRisk): string {
  if (risk === "timing-drift") return "Timing Drift";
  if (risk === "note-difference") return "Note Difference";
  if (risk === "key-not-normalized") return "Key Not Normalized";
  if (risk === "bpm-not-normalized") return "BPM Not Normalized";
  if (risk === "weak-confidence") return "Weak Confidence";
  if (risk === "overlap-conflict") return "Overlap Conflict";
  if (risk === "needs-listening") return "Needs Listening";
  return "Future Detection Only";
}

export function getAllMultiTrackRiffInstances(
  groups: MultiTrackRiffGroup[],
): MultiTrackRiffInstance[] {
  return groups.flatMap((group) => group.instances);
}

export function getReadyMultiTrackRiffInstances(
  groups: MultiTrackRiffGroup[],
): MultiTrackRiffInstance[] {
  return getAllMultiTrackRiffInstances(groups).filter(
    (instance) => instance.status === "ready",
  );
}

export function getReviewMultiTrackRiffInstances(
  groups: MultiTrackRiffGroup[],
): MultiTrackRiffInstance[] {
  return getAllMultiTrackRiffInstances(groups).filter(
    (instance) => instance.status === "needs-review",
  );
}

export function getMultiTrackRiffGroupAverageSimilarity(
  group: MultiTrackRiffGroup,
): number {
  if (group.instances.length === 0) return 0;

  const total = group.instances.reduce(
    (sum, instance) => sum + instance.similarityPercent,
    0,
  );

  return Math.round(total / group.instances.length);
}

export function getMultiTrackRiffGroupAverageNoteMatch(
  group: MultiTrackRiffGroup,
): number {
  if (group.instances.length === 0) return 0;

  const total = group.instances.reduce(
    (sum, instance) => sum + instance.noteMatchPercent,
    0,
  );

  return Math.round(total / group.instances.length);
}

export function getMultiTrackRiffGroupAverageRhythmMatch(
  group: MultiTrackRiffGroup,
): number {
  if (group.instances.length === 0) return 0;

  const total = group.instances.reduce(
    (sum, instance) => sum + instance.rhythmMatchPercent,
    0,
  );

  return Math.round(total / group.instances.length);
}

export function getMultiTrackRiffGroupMaxTimingDrift(
  group: MultiTrackRiffGroup,
): number {
  if (group.instances.length === 0) return 0;

  const max = Math.max(
    ...group.instances.map((instance) => Math.abs(instance.timingDriftSeconds)),
  );

  return Number(max.toFixed(2));
}

export function getMultiTrackRiffGroupReadyCount(group: MultiTrackRiffGroup): number {
  return group.instances.filter((instance) => instance.status === "ready").length;
}

export function getMultiTrackRiffGroupReviewCount(group: MultiTrackRiffGroup): number {
  return group.instances.filter((instance) => instance.status === "needs-review").length;
}

export function getMultiTrackRiffGroupTrackCoverage(group: MultiTrackRiffGroup): number {
  const uniqueTrackIds = new Set(
    group.instances.map((instance) => instance.sourceTrackId),
  );

  return uniqueTrackIds.size;
}

export function getMultiTrackRiffWorkspaceTotalInstanceCount(
  state: MultiTrackRiffGroupWorkspaceState,
): number {
  return getAllMultiTrackRiffInstances(state.groups).length;
}

export function getMultiTrackRiffWorkspaceReadyPercent(
  state: MultiTrackRiffGroupWorkspaceState,
): number {
  const total = getMultiTrackRiffWorkspaceTotalInstanceCount(state);
  if (total === 0) return 0;

  const ready = getReadyMultiTrackRiffInstances(state.groups).length;
  return Math.round((ready / total) * 100);
}

export function getMultiTrackRiffWorkspaceCoveragePercent(
  state: MultiTrackRiffGroupWorkspaceState,
): number {
  if (state.targetTrackCount === 0) return 0;

  const coveredTrackIds = new Set(
    getAllMultiTrackRiffInstances(state.groups).map(
      (instance) => instance.sourceTrackId,
    ),
  );

  return Math.round((coveredTrackIds.size / state.targetTrackCount) * 100);
}

export function getMultiTrackRiffGroupById(
  groups: MultiTrackRiffGroup[],
  groupId: string,
): MultiTrackRiffGroup | null {
  return groups.find((group) => group.id === groupId) ?? null;
}

export function getMultiTrackRiffExtractPlanForGroup(
  plans: MultiTrackRiffExtractPlan[],
  groupId: string,
): MultiTrackRiffExtractPlan | null {
  return plans.find((plan) => plan.riffGroupId === groupId) ?? null;
}

export function getMultiTrackRiffEditPlanForGroup(
  plans: MultiTrackRiffEditPlan[],
  groupId: string,
): MultiTrackRiffEditPlan | null {
  return plans.find((plan) => plan.riffGroupId === groupId) ?? null;
}

export function getMultiTrackRiffExperimentPlanForGroup(
  plans: MultiTrackRiffExperimentPlan[],
  groupId: string,
): MultiTrackRiffExperimentPlan | null {
  return plans.find((plan) => plan.riffGroupId === groupId) ?? null;
}

export function getMultiTrackRiffInstanceReadinessLabel(
  instance: MultiTrackRiffInstance,
): string {
  if (instance.similarityPercent >= 95) return "Monster Match";
  if (instance.similarityPercent >= 90) return "Same Family";
  if (instance.similarityPercent >= 85) return "Review Match";
  return "Weak Match";
}

export function getMultiTrackRiffInstanceRiskSummary(
  instance: MultiTrackRiffInstance,
): string {
  if (instance.risks.length === 0) return "No risks listed";

  return instance.risks.map(getMultiTrackRiffRiskLabel).join(", ");
}

export function getMultiTrackRiffGroupEngineDistanceLabel(
  state: MultiTrackRiffGroupWorkspaceState,
): string {
  const readyPercent = getMultiTrackRiffWorkspaceReadyPercent(state);

  if (readyPercent >= 90) return "Close to extraction";
  if (readyPercent >= 65) return "Manual engine foundation";
  if (readyPercent >= 30) return "Planning engine";
  return "Seed only";
}