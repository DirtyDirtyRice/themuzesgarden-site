import { buildMomentInspectorWorkspaceSources } from "./momentInspectorWorkspaceSources";
import type { MomentInspectorWorkspaceFamilySource } from "./momentInspectorWorkspace.types";

type GenericRecord = Record<string, unknown>;

export function buildMomentInspectorWorkspaceHostBridge(params: {
  families?: GenericRecord[];
}): MomentInspectorWorkspaceFamilySource[] {
  return buildMomentInspectorWorkspaceSources(params.families ?? []);
}