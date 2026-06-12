
import { multiTrackMutationEngineWorkspace } from "./MultiTrackMutationEngineSeed";
import type {
  MultiTrackMutationEngineFamily,
  MultiTrackMutationEngineFinding,
  MultiTrackMutationEngineMutation,
  MultiTrackMutationEngineReadiness,
  MultiTrackMutationEngineRisk,
  MultiTrackMutationEngineStatus,
  MultiTrackMutationEngineSurvivalState,
  MultiTrackMutationEngineVersion,
  MultiTrackMutationEngineWorkspace,
} from "./MultiTrackMutationEngineTypes";

export function getMultiTrackMutationEngineWorkspace(): MultiTrackMutationEngineWorkspace {
  return multiTrackMutationEngineWorkspace;
}

export function getMutationEngineReadinessLabel(
  readiness: MultiTrackMutationEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-riff-groups") return "Needs Riff Groups";
  if (readiness === "needs-similarity") return "Needs Similarity";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getMutationEngineStatusLabel(status: MultiTrackMutationEngineStatus): string {
  if (status === "mapped") return "Mapped";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getMutationEngineRiskLabel(risk: MultiTrackMutationEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getMutationEngineSurvivalStateLabel(
  state: MultiTrackMutationEngineSurvivalState,
): string {
  if (state === "survived") return "Survived";
  if (state === "mutated") return "Mutated";
  if (state === "weakened") return "Weakened";
  if (state === "lost") return "Lost";
  return "Unknown";
}

export function getMutationEngineTimeLabel(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getMutationEngineVersionTimeLabel(version: MultiTrackMutationEngineVersion): string {
  return `${getMutationEngineTimeLabel(version.startMs)} - ${getMutationEngineTimeLabel(
    version.endMs,
  )}`;
}

export function getMutationEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getMutationEngineScoreWidth(value: number): string {
  return `${Math.max(4, getMutationEnginePercent(value))}%`;
}

export function getMutationEngineBestVersion(
  versions: MultiTrackMutationEngineVersion[],
): MultiTrackMutationEngineVersion | null {
  if (versions.length === 0) return null;

  return versions.reduce((best, version) => {
    if (version.confidence > best.confidence) return version;
    return best;
  }, versions[0]);
}

export function getMutationEngineBestFamily(
  families: MultiTrackMutationEngineFamily[],
): MultiTrackMutationEngineFamily | null {
  if (families.length === 0) return null;

  return families.reduce((best, family) => {
    if (family.keeperPotential > best.keeperPotential) return family;
    return best;
  }, families[0]);
}

export function getMutationEngineSurvivedCount(
  versions: MultiTrackMutationEngineVersion[],
): number {
  return versions.filter((version) => version.survivalState === "survived").length;
}

export function getMutationEngineBlockedOrHighRiskCount(
  families: MultiTrackMutationEngineFamily[],
): number {
  return families.filter((family) => family.risk === "high" || family.risk === "blocked").length;
}

export function getMutationEngineAverageKeeperPotential(
  families: MultiTrackMutationEngineFamily[],
): number {
  if (families.length === 0) return 0;
  const total = families.reduce((sum, family) => sum + family.keeperPotential, 0);
  return roundMutationNumber(total / families.length);
}

export function getMutationEngineVersionSummary(version: MultiTrackMutationEngineVersion): string {
  return `${getMutationEngineSurvivalStateLabel(version.survivalState)} / similarity ${
    version.similarityScore
  } / drift ${version.driftMs}ms.`;
}

export function getMutationEngineMutationSummary(
  mutation: MultiTrackMutationEngineMutation,
): string {
  return `${mutation.amountLabel} / ${getMutationEngineStatusLabel(
    mutation.status,
  )} / ${getMutationEngineRiskLabel(mutation.risk)}.`;
}

export function getMutationEngineFamilySummary(family: MultiTrackMutationEngineFamily): string {
  return `Survival ${family.survivalScore}, mutation ${family.mutationScore}, keeper ${family.keeperPotential}.`;
}

export function getMutationEngineFindingAction(
  finding: MultiTrackMutationEngineFinding,
): string {
  return `${getMutationEngineStatusLabel(finding.status)} / ${getMutationEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildMutationEnginePlanningSentence(
  workspace: MultiTrackMutationEngineWorkspace,
): string {
  const bestFamily = getMutationEngineBestFamily(workspace.families);
  const bestVersion = getMutationEngineBestVersion(workspace.versions);

  if (!bestFamily || !bestVersion) {
    return "Mutation engine needs version and family data before planning.";
  }

  return `${bestFamily.title} is strongest. Best current version is ${bestVersion.title}. Recommendation: ${bestFamily.recommendation}`;
}

function roundMutationNumber(value: number): number {
  return Math.round(value * 100) / 100;
}