import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildMomentInspectorWorkspaceSearchTokens(
  item: MomentInspectorWorkspaceFamilyItem
): string[] {
  return unique([
    normalizeText(item.familyId).toLowerCase(),
    normalizeText(item.label).toLowerCase(),
    normalizeText(item.title).toLowerCase(),
    normalizeText(item.verdict).toLowerCase(),
    normalizeText(item.recommendedNextStep).toLowerCase(),
    ...item.riskFlags.map((flag) => normalizeText(flag).toLowerCase()),
    ...item.diagnosticNotes.map((note) => normalizeText(note).toLowerCase()),
  ]);
}

export function buildMomentInspectorWorkspaceSearchBlob(
  item: MomentInspectorWorkspaceFamilyItem
): string {
  return buildMomentInspectorWorkspaceSearchTokens(item).join(" ");
}