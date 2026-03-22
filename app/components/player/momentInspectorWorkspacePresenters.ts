import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

type WorkspacePriorityGroup = {
  key: string;
  label: string;
  items: any[];
};

export type MomentInspectorWorkspacePresentation =
  | {
      mode: "flat";
    }
  | {
      mode: "grouped";
      groups: WorkspacePriorityGroup[];
    };

function getPriorityValue(item: any): number {
  const direct = Number(item?.priorityScore);
  if (Number.isFinite(direct)) return direct;

  const fallback = Number(item?.repairPriorityScore);
  if (Number.isFinite(fallback)) return fallback;

  return 0;
}

function buildPriorityLabel(key: string): string {
  if (key === "high") return "High Priority";
  if (key === "medium") return "Medium Priority";
  return "Low Priority";
}

function getPriorityKey(item: any): string {
  const priority = getPriorityValue(item);

  if (priority >= 75) return "high";
  if (priority >= 40) return "medium";
  return "low";
}

function groupWorkspaceByPriority(items: any[]): WorkspacePriorityGroup[] {
  const groupsByKey: Record<string, WorkspacePriorityGroup> = {
    high: {
      key: "high",
      label: buildPriorityLabel("high"),
      items: [],
    },
    medium: {
      key: "medium",
      label: buildPriorityLabel("medium"),
      items: [],
    },
    low: {
      key: "low",
      label: buildPriorityLabel("low"),
      items: [],
    },
  };

  for (const item of items ?? []) {
    const key = getPriorityKey(item);
    groupsByKey[key]?.items.push(item);
  }

  return ["high", "medium", "low"]
    .map((key) => groupsByKey[key])
    .filter((group): group is WorkspacePriorityGroup => Boolean(group))
    .filter((group) => group.items.length > 0);
}

export function buildMomentInspectorWorkspacePresentation(params: {
  state: MomentInspectorWorkspaceDerivedState;
  groupMode: MomentInspectorWorkspaceGroupMode;
}): MomentInspectorWorkspacePresentation {
  if (params.groupMode === "priority") {
    return {
      mode: "grouped",
      groups: groupWorkspaceByPriority((params.state as any)?.activeItems ?? []),
    };
  }

  return {
    mode: "flat",
  };
}
