import { adaptInspectorToWorkspace } from "./momentInspectorWorkspaceAdapter";
import { buildWorkspaceGroups } from "./momentInspectorWorkspaceGrouping";

export function buildWorkspaceController(input: any) {
  const adapted = adaptInspectorToWorkspace(input);

  const groups = buildWorkspaceGroups(adapted);

  return {
    groups,
    watch: adapted.watch,
    repair: adapted.repair,
    all: adapted.all,
  };
}