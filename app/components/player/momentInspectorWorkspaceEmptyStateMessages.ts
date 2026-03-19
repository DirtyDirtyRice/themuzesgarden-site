import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";
import { getMomentInspectorWorkspaceLaneMeta } from "./momentInspectorWorkspaceLaneMeta";

export type MomentInspectorWorkspaceEmptyStateMessage = {
  title: string;
  body: string;
};

export function buildMomentInspectorWorkspaceEmptyStateMessage(params: {
  lane: MomentInspectorWorkspaceLane;
  searchQuery: string;
}): MomentInspectorWorkspaceEmptyStateMessage {
  const laneMeta = getMomentInspectorWorkspaceLaneMeta(params.lane);
  const query = String(params.searchQuery ?? "").trim();

  if (query) {
    return {
      title: `No ${laneMeta.label.toLowerCase()} families found`,
      body: `No items matched "${query}" in this queue.`,
    };
  }

  return {
    title: `No ${laneMeta.label.toLowerCase()} families found`,
    body: laneMeta.description,
  };
}