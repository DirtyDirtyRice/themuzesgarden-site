import type {
  MultiTrackArrangementEnergyLevel,
  MultiTrackArrangementEvidenceSource,
  MultiTrackArrangementFlow,
  MultiTrackArrangementReadinessStatus,
  MultiTrackArrangementRisk,
  MultiTrackArrangementRole,
  MultiTrackArrangementSection,
  MultiTrackArrangementSectionType,
  MultiTrackArrangementWorkspaceState,
} from "./MultiTrackArrangementIntelligenceTypes";

export function getMultiTrackArrangementStatusLabel(
  status: MultiTrackArrangementReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackArrangementStatusClass(
  status: MultiTrackArrangementReadinessStatus,
): string {
  if (status === "ready") return "border-white/40 bg-white/10 text-white";
  if (status === "needs-review") return "border-white/30 bg-black text-white/80";
  if (status === "blocked") return "border-white/20 bg-black text-white/70";
  return "border-white/10 bg-black text-white/60";
}

export function getMultiTrackArrangementSectionTypeLabel(
  sectionType: MultiTrackArrangementSectionType,
): string {
  if (sectionType === "intro") return "Intro";
  if (sectionType === "verse") return "Verse";
  if (sectionType === "pre-chorus") return "Pre-Chorus";
  if (sectionType === "chorus") return "Chorus";
  if (sectionType === "post-chorus") return "Post-Chorus";
  if (sectionType === "bridge") return "Bridge";
  if (sectionType === "breakdown") return "Breakdown";
  if (sectionType === "solo") return "Solo";
  if (sectionType === "hook") return "Hook";
  if (sectionType === "turnaround") return "Turnaround";
  if (sectionType === "outro") return "Outro";
  if (sectionType === "unknown") return "Unknown";
  return "Future";
}

export function getMultiTrackArrangementEnergyLabel(
  energyLevel: MultiTrackArrangementEnergyLevel,
): string {
  if (energyLevel === "low") return "Low";
  if (energyLevel === "medium") return "Medium";
  if (energyLevel === "high") return "High";
  if (energyLevel === "peak") return "Peak";
  return "Unknown";
}

export function getMultiTrackArrangementRoleLabel(
  role: MultiTrackArrangementRole,
): string {
  if (role === "setup") return "Setup";
  if (role === "story") return "Story";
  if (role === "lift") return "Lift";
  if (role === "release") return "Release";
  if (role === "contrast") return "Contrast";
  if (role === "reset") return "Reset";
  if (role === "transition") return "Transition";
  if (role === "ending") return "Ending";
  return "Unknown";
}

export function getMultiTrackArrangementEvidenceSourceLabel(
  source: MultiTrackArrangementEvidenceSource,
): string {
  if (source === "manual-marker") return "Manual Marker";
  if (source === "cue") return "Cue";
  if (source === "waveform") return "Waveform";
  if (source === "transient") return "Transient";
  if (source === "detection") return "Detection";
  if (source === "comparison") return "Comparison";
  if (source === "confidence") return "Confidence";
  return "Future AI";
}

export function getMultiTrackArrangementRiskLabel(
  risk: MultiTrackArrangementRisk,
): string {
  if (risk === "missing-section-boundary") return "Missing Section Boundary";
  if (risk === "missing-duration") return "Missing Duration";
  if (risk === "unclear-role") return "Unclear Role";
  if (risk === "weak-confidence") return "Weak Confidence";
  if (risk === "needs-human-review") return "Needs Human Review";
  return "Future Only";
}

export function getMultiTrackArrangementSectionById(
  sections: MultiTrackArrangementSection[],
  sectionId: string,
): MultiTrackArrangementSection | undefined {
  return sections.find((section) => section.id === sectionId);
}

export function getMultiTrackArrangementFlowSections(
  flow: MultiTrackArrangementFlow,
  sections: MultiTrackArrangementSection[],
): MultiTrackArrangementSection[] {
  return flow.sectionIds
    .map((sectionId) => getMultiTrackArrangementSectionById(sections, sectionId))
    .filter((section): section is MultiTrackArrangementSection =>
      Boolean(section),
    );
}

export function getMultiTrackArrangementReadySectionCount(
  sections: MultiTrackArrangementSection[],
): number {
  return sections.filter((section) => section.readinessStatus === "ready").length;
}

export function getMultiTrackArrangementReviewSectionCount(
  sections: MultiTrackArrangementSection[],
): number {
  return sections.filter((section) => section.readinessStatus === "needs-review")
    .length;
}

export function getMultiTrackArrangementPeakSectionCount(
  sections: MultiTrackArrangementSection[],
): number {
  return sections.filter((section) => section.energyLevel === "peak").length;
}

export function getMultiTrackArrangementSectionRiskSummary(
  section: MultiTrackArrangementSection,
): string {
  if (section.risks.length === 0) return "No risks listed.";
  return section.risks.map(getMultiTrackArrangementRiskLabel).join(", ");
}

export function getMultiTrackArrangementWorkspaceSummary(
  workspace: MultiTrackArrangementWorkspaceState,
): string {
  const readySections = getMultiTrackArrangementReadySectionCount(
    workspace.sections,
  );
  const reviewSections = getMultiTrackArrangementReviewSectionCount(
    workspace.sections,
  );
  const peakSections = getMultiTrackArrangementPeakSectionCount(
    workspace.sections,
  );

  return `${readySections} ready sections, ${reviewSections} review sections, ${peakSections} peak energy sections, and ${workspace.flows.length} arrangement flows.`;
}