export type MomentInspectorWorkspaceGroup = {
  lane: "watch" | "repair";
  label: string;
  items: any[];
};

export function buildWorkspaceGroups(data: {
  watch: any[];
  repair: any[];
}): MomentInspectorWorkspaceGroup[] {
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