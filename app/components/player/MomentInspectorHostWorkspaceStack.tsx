"use client";

import MomentInspectorWorkspacePanel from "./MomentInspectorWorkspacePanel";
import { buildMomentInspectorWorkspaceHostBridge } from "./momentInspectorWorkspaceHostBridge";

type Props = {
  families?: Record<string, unknown>[];
};

export default function MomentInspectorHostWorkspaceStack(props: Props) {
  const sources = buildMomentInspectorWorkspaceHostBridge({
    families: props.families ?? [],
  });

  return (
    <MomentInspectorWorkspacePanel
      familySources={sources}
      title="Inspector Repair / Watchlist Workspace"
      subtitle="Review and act on families that need attention."
    />
  );
}