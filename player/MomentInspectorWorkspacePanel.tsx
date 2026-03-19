"use client";

import MomentInspectorWorkspacePanelScaffold from "./MomentInspectorWorkspacePanelScaffold";
import MomentInspectorWorkspacePanelSections from "./MomentInspectorWorkspacePanelSections";
import { useMomentInspectorWorkspacePanelState } from "./momentInspectorWorkspacePanelState";
import { buildMomentInspectorWorkspacePanelResolver } from "./momentInspectorWorkspacePanelResolver";
import type { MomentInspectorWorkspacePanelProps } from "./momentInspectorWorkspace.types";

export default function MomentInspectorWorkspacePanel(
  props: MomentInspectorWorkspacePanelProps
) {
  const panelState = useMomentInspectorWorkspacePanelState(props);

  const { context, actions } = buildMomentInspectorWorkspacePanelResolver({
    panelProps: props,
    panelState,
  });

  return (
    <MomentInspectorWorkspacePanelScaffold>
      <MomentInspectorWorkspacePanelSections
        context={context}
        actions={actions}
      />
    </MomentInspectorWorkspacePanelScaffold>
  );
}