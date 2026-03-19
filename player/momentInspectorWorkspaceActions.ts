import type {
  MomentInspectorWorkspaceFamilyItem,
  MomentInspectorWorkspaceLane,
} from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceActionId =
  | "review"
  | "repair"
  | "resolve-block"
  | "bookmark"
  | "compare";

export type MomentInspectorWorkspaceAction = {
  id: MomentInspectorWorkspaceActionId;
  label: string;
  emphasis: "primary" | "secondary";
  enabled: boolean;
};

function buildLanePrimaryAction(
  lane: MomentInspectorWorkspaceLane
): MomentInspectorWorkspaceAction {
  if (lane === "blocked") {
    return {
      id: "resolve-block",
      label: "Resolve Block",
      emphasis: "primary",
      enabled: true,
    };
  }

  if (lane === "repair") {
    return {
      id: "repair",
      label: "Start Repair",
      emphasis: "primary",
      enabled: true,
    };
  }

  return {
    id: "review",
    label: "Review Family",
    emphasis: "primary",
    enabled: true,
  };
}

export function buildMomentInspectorWorkspaceActions(
  item: MomentInspectorWorkspaceFamilyItem
): MomentInspectorWorkspaceAction[] {
  const actions: MomentInspectorWorkspaceAction[] = [
    buildLanePrimaryAction(item.lane),
    {
      id: "bookmark",
      label: item.bookmarked ? "Bookmarked" : "Bookmark",
      emphasis: "secondary",
      enabled: true,
    },
    {
      id: "compare",
      label: item.compared ? "Compared" : "Compare",
      emphasis: "secondary",
      enabled: true,
    },
  ];

  return actions;
}