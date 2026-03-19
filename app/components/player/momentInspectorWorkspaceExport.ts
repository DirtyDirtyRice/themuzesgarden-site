import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceExportRow = {
  familyId: string;
  label: string;
  lane: string;
  verdict: string;
  confidenceScore: number | null;
  readinessScore: number | null;
  repairPriorityScore: number | null;
  driftSeverityScore: number | null;
  pinned: boolean;
  bookmarked: boolean;
  compared: boolean;
  recommendedNextStep: string;
  riskFlags: string;
  diagnosticNotes: string;
};

export function buildMomentInspectorWorkspaceExportRows(
  items: MomentInspectorWorkspaceFamilyItem[]
): MomentInspectorWorkspaceExportRow[] {
  return items.map((item) => ({
    familyId: item.familyId,
    label: item.label,
    lane: item.lane,
    verdict: item.verdict,
    confidenceScore: item.confidenceScore,
    readinessScore: item.readinessScore,
    repairPriorityScore: item.repairPriorityScore,
    driftSeverityScore: item.driftSeverityScore,
    pinned: item.pinned,
    bookmarked: item.bookmarked,
    compared: item.compared,
    recommendedNextStep: item.recommendedNextStep ?? "",
    riskFlags: item.riskFlags.join(" | "),
    diagnosticNotes: item.diagnosticNotes.join(" | "),
  }));
}