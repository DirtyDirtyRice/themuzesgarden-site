import type { MomentInspectorWorkspaceFamilySource } from "./momentInspectorWorkspace.types";

export function isMomentInspectorWorkspaceReady(
  sources: MomentInspectorWorkspaceFamilySource[]
): boolean {
  return Array.isArray(sources) && sources.length > 0;
}