import type { MomentInspectorWorkspaceSortMode } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceGroupMode = "none" | "priority";

export type MomentInspectorWorkspaceViewOptions = {
  sortMode: MomentInspectorWorkspaceSortMode;
  groupMode: MomentInspectorWorkspaceGroupMode;
};

export function createDefaultMomentInspectorWorkspaceViewOptions(): MomentInspectorWorkspaceViewOptions {
  return {
    sortMode: "priority",
    groupMode: "none",
  };
}

export function getMomentInspectorWorkspaceSortOptions(): Array<{
  value: MomentInspectorWorkspaceSortMode;
  label: string;
}> {
  return [
    { value: "priority", label: "Priority" },
    { value: "confidence", label: "Confidence" },
    { value: "readiness", label: "Readiness" },
    { value: "alphabetical", label: "A-Z" },
  ];
}

export function getMomentInspectorWorkspaceGroupOptions(): Array<{
  value: MomentInspectorWorkspaceGroupMode;
  label: string;
}> {
  return [
    { value: "none", label: "No Grouping" },
    { value: "priority", label: "Group by Priority" },
  ];
}