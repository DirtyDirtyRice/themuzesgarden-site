import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceBatchActionId =
  | "compare-selected"
  | "bookmark-selected"
  | "send-to-repair"
  | "send-to-watch"
  | "review-blocks"
  | "clear-selection";

export type MomentInspectorWorkspaceBatchAction = {
  id: MomentInspectorWorkspaceBatchActionId;
  label: string;
  emphasis: "primary" | "secondary";
  enabled: boolean;
};

export function buildMomentInspectorWorkspaceBatchActions(params: {
  selectedCount: number;
  activeLane: MomentInspectorWorkspaceLane;
}): MomentInspectorWorkspaceBatchAction[] {
  const hasSelection = params.selectedCount > 0;

  const actions: MomentInspectorWorkspaceBatchAction[] = [
    {
      id: "compare-selected",
      label: "Compare Selected",
      emphasis: "primary",
      enabled: hasSelection && params.selectedCount >= 2,
    },
    {
      id: "bookmark-selected",
      label: "Bookmark Selected",
      emphasis: "secondary",
      enabled: hasSelection,
    },
    {
      id: "clear-selection",
      label: "Clear Selection",
      emphasis: "secondary",
      enabled: hasSelection,
    },
  ];

  if (params.activeLane === "watch") {
    actions.push({
      id: "send-to-repair",
      label: "Send to Repair",
      emphasis: "secondary",
      enabled: hasSelection,
    });
  }

  if (params.activeLane === "repair") {
    actions.push({
      id: "send-to-watch",
      label: "Move to Watch",
      emphasis: "secondary",
      enabled: hasSelection,
    });
  }

  if (params.activeLane === "blocked") {
    actions.push({
      id: "review-blocks",
      label: "Review Blocks",
      emphasis: "secondary",
      enabled: hasSelection,
    });
  }

  return actions;
}