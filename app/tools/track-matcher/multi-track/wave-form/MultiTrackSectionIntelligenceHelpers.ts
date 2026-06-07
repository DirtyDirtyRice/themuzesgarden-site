import type {
  MultiTrackSectionBehavior,
  MultiTrackSectionEnergyShape,
  MultiTrackSectionEvidenceSource,
  MultiTrackSectionReadinessStatus,
  MultiTrackSectionReviewGroup,
  MultiTrackSectionRisk,
  MultiTrackSectionRole,
  MultiTrackSectionTransition,
  MultiTrackSectionTransitionType,
  MultiTrackSectionUnit,
  MultiTrackSectionWorkspaceState,
} from "./MultiTrackSectionIntelligenceTypes";

export function getMultiTrackSectionStatusLabel(
  status: MultiTrackSectionReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackSectionStatusClass(
  status: MultiTrackSectionReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackSectionRoleLabel(
  role: MultiTrackSectionRole,
): string {
  if (role === "intro") return "Intro";
  if (role === "setup") return "Setup";
  if (role === "story") return "Story";
  if (role === "lift") return "Lift";
  if (role === "hook") return "Hook";
  if (role === "release") return "Release";
  if (role === "contrast") return "Contrast";
  if (role === "reset") return "Reset";
  if (role === "solo") return "Solo";
  if (role === "transition") return "Transition";
  if (role === "ending") return "Ending";
  if (role === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackSectionBehaviorLabel(
  behavior: MultiTrackSectionBehavior,
): string {
  if (behavior === "stable") return "Stable";
  if (behavior === "builds") return "Builds";
  if (behavior === "drops") return "Drops";
  if (behavior === "changes-key") return "Changes Key";
  if (behavior === "changes-groove") return "Changes Groove";
  if (behavior === "adds-stems") return "Adds Stems";
  if (behavior === "removes-stems") return "Removes Stems";
  if (behavior === "repeats") return "Repeats";
  if (behavior === "varies") return "Varies";
  if (behavior === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackSectionEnergyShapeLabel(
  energyShape: MultiTrackSectionEnergyShape,
): string {
  if (energyShape === "flat") return "Flat";
  if (energyShape === "rising") return "Rising";
  if (energyShape === "falling") return "Falling";
  if (energyShape === "dip-and-return") return "Dip And Return";
  if (energyShape === "peak") return "Peak";
  if (energyShape === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackSectionTransitionTypeLabel(
  transitionType: MultiTrackSectionTransitionType,
): string {
  if (transitionType === "clean-cut") return "Clean Cut";
  if (transitionType === "fade") return "Fade";
  if (transitionType === "fill") return "Fill";
  if (transitionType === "drop") return "Drop";
  if (transitionType === "pickup") return "Pickup";
  if (transitionType === "overlap") return "Overlap";
  if (transitionType === "stop") return "Stop";
  if (transitionType === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackSectionEvidenceSourceLabel(
  evidenceSource: MultiTrackSectionEvidenceSource,
): string {
  if (evidenceSource === "manual-section") return "Manual Section";
  if (evidenceSource === "cue") return "Cue";
  if (evidenceSource === "marker") return "Marker";
  if (evidenceSource === "waveform") return "Waveform";
  if (evidenceSource === "transient") return "Transient";
  if (evidenceSource === "detection") return "Detection";
  if (evidenceSource === "arrangement") return "Arrangement";
  if (evidenceSource === "comparison") return "Comparison";
  if (evidenceSource === "confidence") return "Confidence";
  return "Future AI";
}

export function getMultiTrackSectionRiskLabel(
  risk: MultiTrackSectionRisk,
): string {
  if (risk === "missing-boundary") return "Missing Boundary";
  if (risk === "missing-cue") return "Missing Cue";
  if (risk === "missing-marker") return "Missing Marker";
  if (risk === "weak-confidence") return "Weak Confidence";
  if (risk === "unclear-transition") return "Unclear Transition";
  if (risk === "unverified-section-role") return "Unverified Section Role";
  if (risk === "needs-human-review") return "Needs Human Review";
  return "Future Only";
}

export function getMultiTrackSectionById(
  sections: MultiTrackSectionUnit[],
  sectionId: string,
): MultiTrackSectionUnit | undefined {
  return sections.find((section) => section.id === sectionId);
}

export function getMultiTrackSectionTransitionById(
  transitions: MultiTrackSectionTransition[],
  transitionId: string,
): MultiTrackSectionTransition | undefined {
  return transitions.find((transition) => transition.id === transitionId);
}

export function getMultiTrackSectionReviewGroupSections(
  group: MultiTrackSectionReviewGroup,
  sections: MultiTrackSectionUnit[],
): MultiTrackSectionUnit[] {
  return group.sectionIds
    .map((sectionId) => getMultiTrackSectionById(sections, sectionId))
    .filter((section): section is MultiTrackSectionUnit => Boolean(section));
}

export function getMultiTrackSectionReviewGroupTransitions(
  group: MultiTrackSectionReviewGroup,
  transitions: MultiTrackSectionTransition[],
): MultiTrackSectionTransition[] {
  return group.transitionIds
    .map((transitionId) =>
      getMultiTrackSectionTransitionById(transitions, transitionId),
    )
    .filter((transition): transition is MultiTrackSectionTransition =>
      Boolean(transition),
    );
}

export function getMultiTrackSectionTransitionLabel(
  transition: MultiTrackSectionTransition,
  sections: MultiTrackSectionUnit[],
): string {
  const fromSection = getMultiTrackSectionById(sections, transition.fromSectionId);
  const toSection = getMultiTrackSectionById(sections, transition.toSectionId);

  return `${fromSection?.label ?? "Unknown Section"} → ${
    toSection?.label ?? "Unknown Section"
  }`;
}

export function getMultiTrackSectionRiskSummary(
  risks: MultiTrackSectionRisk[],
): string {
  if (risks.length === 0) return "No risks listed.";
  return risks.map(getMultiTrackSectionRiskLabel).join(", ");
}

export function getMultiTrackSectionReadyCount(
  sections: MultiTrackSectionUnit[],
): number {
  return sections.filter((section) => section.readinessStatus === "ready").length;
}

export function getMultiTrackSectionReviewCount(
  sections: MultiTrackSectionUnit[],
): number {
  return sections.filter((section) => section.readinessStatus === "needs-review")
    .length;
}

export function getMultiTrackSectionPeakCount(
  sections: MultiTrackSectionUnit[],
): number {
  return sections.filter((section) => section.energyShape === "peak").length;
}

export function getMultiTrackSectionReadyTransitionCount(
  transitions: MultiTrackSectionTransition[],
): number {
  return transitions.filter((transition) => transition.readinessStatus === "ready")
    .length;
}

export function getMultiTrackSectionWorkspaceSummary(
  workspace: MultiTrackSectionWorkspaceState,
): string {
  const readySections = getMultiTrackSectionReadyCount(workspace.sections);
  const reviewSections = getMultiTrackSectionReviewCount(workspace.sections);
  const peakSections = getMultiTrackSectionPeakCount(workspace.sections);
  const readyTransitions = getMultiTrackSectionReadyTransitionCount(
    workspace.transitions,
  );

  return `${readySections} ready sections, ${reviewSections} review sections, ${peakSections} peak sections, and ${readyTransitions} ready transitions.`;
}