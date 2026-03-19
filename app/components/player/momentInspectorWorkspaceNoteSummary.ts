import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceNoteSummary = {
  familyCountWithNotes: number;
  totalNoteCount: number;
  familyCountWithRiskFlags: number;
  totalRiskFlagCount: number;
};

export function buildMomentInspectorWorkspaceNoteSummary(
  items: MomentInspectorWorkspaceFamilyItem[]
): MomentInspectorWorkspaceNoteSummary {
  return {
    familyCountWithNotes: items.filter((item) => item.diagnosticNotes.length > 0)
      .length,
    totalNoteCount: items.reduce(
      (sum, item) => sum + item.diagnosticNotes.length,
      0
    ),
    familyCountWithRiskFlags: items.filter((item) => item.riskFlags.length > 0)
      .length,
    totalRiskFlagCount: items.reduce(
      (sum, item) => sum + item.riskFlags.length,
      0
    ),
  };
}