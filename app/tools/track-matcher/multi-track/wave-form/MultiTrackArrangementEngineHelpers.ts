import type {
  MultiTrackArrangementAction,
  MultiTrackArrangementPriority,
  MultiTrackArrangementReadinessStatus,
  MultiTrackArrangementRisk,
  MultiTrackArrangementSection,
  MultiTrackArrangementSectionKind,
  MultiTrackArrangementWorkspaceState,
} from "./MultiTrackArrangementEngineTypes";

export function getMultiTrackArrangementReadinessLabel(
  status: MultiTrackArrangementReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackArrangementSectionKindLabel(kind: MultiTrackArrangementSectionKind): string {
  if (kind === "intro") return "Intro";
  if (kind === "verse") return "Verse";
  if (kind === "pre-chorus") return "Pre-Chorus";
  if (kind === "chorus") return "Chorus";
  if (kind === "hook") return "Hook";
  if (kind === "bridge") return "Bridge";
  if (kind === "breakdown") return "Breakdown";
  if (kind === "solo") return "Solo";
  if (kind === "outro") return "Outro";
  return "Transition";
}

export function getMultiTrackArrangementActionLabel(action: MultiTrackArrangementAction): string {
  if (action === "place") return "Place";
  if (action === "duplicate") return "Duplicate";
  if (action === "trim") return "Trim";
  if (action === "loop") return "Loop";
  if (action === "move") return "Move";
  if (action === "swap") return "Swap";
  if (action === "review") return "Review";
  return "Prepare Render";
}

export function getMultiTrackArrangementPriorityLabel(priority: MultiTrackArrangementPriority): string {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Parking Lot";
}

export function getMultiTrackArrangementRiskLabel(risk: MultiTrackArrangementRisk): string {
  if (risk === "missing-audio") return "Missing Audio";
  if (risk === "rough-transition") return "Rough Transition";
  if (risk === "weak-hook") return "Weak Hook";
  if (risk === "needs-human-review") return "Needs Human Review";
  if (risk === "timing-risk") return "Timing Risk";
  if (risk === "key-risk") return "Key Risk";
  if (risk === "energy-drop") return "Energy Drop";
  return "Seed Placeholder";
}

export function getMultiTrackArrangementBarLength(section: MultiTrackArrangementSection): number {
  return Math.max(0, section.endBar - section.startBar + 1);
}

export function getMultiTrackArrangementComputedScore(section: MultiTrackArrangementSection): number {
  const priorityBoost = getMultiTrackArrangementPriorityBoost(section.priority);
  const readinessBoost = getMultiTrackArrangementReadinessBoost(section.readinessStatus);
  const repeatBoost = Math.min(section.repeatCount * 3, 12);
  const riskPenalty = Math.min(section.risks.length * 4, 20);

  return Math.round(
    section.energyScore * 0.2 +
      section.hookScore * 0.28 +
      section.transitionScore * 0.18 +
      section.arrangementScore * 0.24 +
      priorityBoost * 100 * 0.06 +
      readinessBoost * 100 * 0.04 +
      repeatBoost -
      riskPenalty,
  );
}

export function sortMultiTrackArrangementSectionsByScore(
  sections: MultiTrackArrangementSection[],
): MultiTrackArrangementSection[] {
  return [...sections].sort(
    (left, right) =>
      getMultiTrackArrangementComputedScore(right) - getMultiTrackArrangementComputedScore(left),
  );
}

export function sortMultiTrackArrangementSectionsByOrder(
  sections: MultiTrackArrangementSection[],
): MultiTrackArrangementSection[] {
  return [...sections].sort((left, right) => left.targetOrder - right.targetOrder);
}

export function getMultiTrackArrangementBestSection(
  sections: MultiTrackArrangementSection[],
): MultiTrackArrangementSection | undefined {
  return sortMultiTrackArrangementSectionsByScore(sections)[0];
}

export function getMultiTrackArrangementSectionsByKind(
  sections: MultiTrackArrangementSection[],
  kind: MultiTrackArrangementSectionKind,
): MultiTrackArrangementSection[] {
  return sections.filter((section) => section.sectionKind === kind);
}

export function getMultiTrackArrangementSectionsByReadiness(
  sections: MultiTrackArrangementSection[],
  readinessStatus: MultiTrackArrangementReadinessStatus,
): MultiTrackArrangementSection[] {
  return sections.filter((section) => section.readinessStatus === readinessStatus);
}

export function getMultiTrackArrangementSectionsForAction(
  sections: MultiTrackArrangementSection[],
  action: MultiTrackArrangementAction,
): MultiTrackArrangementSection[] {
  return sections.filter((section) => section.actions.includes(action));
}

export function getMultiTrackArrangementLaneSections(
  state: MultiTrackArrangementWorkspaceState,
  laneId: string,
): MultiTrackArrangementSection[] {
  const lane = state.lanes.find((item) => item.id === laneId);
  if (!lane) return [];

  return lane.sectionIds
    .map((sectionId) => state.sections.find((section) => section.id === sectionId))
    .filter((section): section is MultiTrackArrangementSection => Boolean(section));
}

export function getMultiTrackArrangementSectionTitle(
  state: MultiTrackArrangementWorkspaceState,
  sectionId: string,
): string {
  return state.sections.find((section) => section.id === sectionId)?.title ?? "Unknown arrangement section";
}

export function getMultiTrackArrangementWorkspaceSummary(
  state: MultiTrackArrangementWorkspaceState,
): {
  sectionCount: number;
  readyCount: number;
  reviewCount: number;
  hookCount: number;
  renderPrepCount: number;
  duplicatedCount: number;
  bestSectionTitle: string;
  bestSectionScore: number;
} {
  const bestSection = getMultiTrackArrangementBestSection(state.sections);

  return {
    sectionCount: state.sections.length,
    readyCount: getMultiTrackArrangementSectionsByReadiness(state.sections, "ready").length,
    reviewCount: getMultiTrackArrangementSectionsByReadiness(state.sections, "needs-review").length,
    hookCount:
      getMultiTrackArrangementSectionsByKind(state.sections, "hook").length +
      getMultiTrackArrangementSectionsByKind(state.sections, "chorus").length,
    renderPrepCount: state.renderPrepItems.length,
    duplicatedCount: getMultiTrackArrangementSectionsForAction(state.sections, "duplicate").length,
    bestSectionTitle: bestSection?.title ?? "No arrangement section",
    bestSectionScore: bestSection ? getMultiTrackArrangementComputedScore(bestSection) : 0,
  };
}

function getMultiTrackArrangementPriorityBoost(priority: MultiTrackArrangementPriority): number {
  if (priority === "critical") return 1;
  if (priority === "high") return 0.82;
  if (priority === "medium") return 0.62;
  if (priority === "low") return 0.36;
  return 0.18;
}

function getMultiTrackArrangementReadinessBoost(status: MultiTrackArrangementReadinessStatus): number {
  if (status === "ready") return 1;
  if (status === "needs-review") return 0.58;
  if (status === "future") return 0.34;
  return 0;
}