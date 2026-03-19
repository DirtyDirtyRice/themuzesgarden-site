import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceLaneMeta = {
  lane: MomentInspectorWorkspaceLane;
  label: string;
  shortLabel: string;
  description: string;
};

const LANE_META: Record<
  MomentInspectorWorkspaceLane,
  MomentInspectorWorkspaceLaneMeta
> = {
  watch: {
    lane: "watch",
    label: "Watch Families",
    shortLabel: "Watch",
    description: "Families that should be monitored before they need repair.",
  },
  repair: {
    lane: "repair",
    label: "Repair Queue",
    shortLabel: "Repair",
    description: "Families that need direct repair attention.",
  },
};

export function getMomentInspectorWorkspaceLaneMeta(
  lane: MomentInspectorWorkspaceLane
): MomentInspectorWorkspaceLaneMeta {
  return (
    LANE_META[lane] ?? {
      lane,
      label: "Workspace",
      shortLabel: "Workspace",
      description: "Workspace lane",
    }
  );
}