import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

export function groupWorkspaceByPriority(items: unknown[]) {
  return [
    {
      id: "all",
      label: "All",
      items,
    },
  ];
}

export type MomentInspectorWorkspacePresentation =
  | {
      mode: "flat";
    }
  | {
      mode: "grouped";
      groups: ReturnType<typeof groupWorkspaceByPriority>;
    };

export function buildMomentInspectorWorkspacePresentation(params: {
  state: MomentInspectorWorkspaceDerivedState;
  groupMode: MomentInspectorWorkspaceGroupMode;
}): MomentInspectorWorkspacePresentation {
  if (params.groupMode === "priority") {
    return {
      mode: "grouped",
      groups: groupWorkspaceByPriority(params.state.activeItems),
    };
  }

  return {
    mode: "flat",
  };
}
