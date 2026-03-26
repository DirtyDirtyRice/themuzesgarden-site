import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

type WorkspacePriorityGroup = {
  id: string;
  label: string;
  items: unknown[];
};

function groupWorkspaceByPriority(items: unknown[]): WorkspacePriorityGroup[] {
  return [
    {
      id: "all",
      label: "All",
      items: items ?? [],
    },
  ];
}

export type MomentInspectorWorkspacePresentation =
  | {
      mode: "flat";
    }
  | {
      mode: "grouped";
      groups: WorkspacePriorityGroup[];
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
