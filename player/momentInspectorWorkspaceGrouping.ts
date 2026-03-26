export type MomentInspectorWorkspacePriorityGroup<T = unknown> = {
  id: string;
  label: string;
  items: T[];
};

export function groupWorkspaceByPriority<T = unknown>(
  items: T[]
): MomentInspectorWorkspacePriorityGroup<T>[] {
  return [
    {
      id: "all",
      label: "All",
      items: items ?? [],
    },
  ];
}

export type MomentInspectorWorkspaceGroup<T = unknown> = {
  lane: "watch" | "repair";
  label: string;
  items: T[];
};

export function buildWorkspaceGroups<T = unknown>(data: {
  watch: T[];
  repair: T[];
}): MomentInspectorWorkspaceGroup<T>[] {
  return [
    {
      lane: "watch",
      label: "Watch",
      items: data.watch ?? [],
    },
    {
      lane: "repair",
      label: "Repair",
      items: data.repair ?? [],
    },
  ];
}
