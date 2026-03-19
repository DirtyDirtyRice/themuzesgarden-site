import { buildMomentInspectorWorkspacePanelContext } from "./momentInspectorWorkspacePanelContext";
import type { MomentInspectorWorkspacePanelProps } from "./momentInspectorWorkspace.types";
import type { useMomentInspectorWorkspacePanelState } from "./momentInspectorWorkspacePanelState";

type MomentInspectorWorkspacePanelStateResult = ReturnType<
  typeof useMomentInspectorWorkspacePanelState
>;

export type MomentInspectorWorkspacePanelResolverResult = {
  context: ReturnType<typeof buildMomentInspectorWorkspacePanelContext>;
  actions: MomentInspectorWorkspacePanelStateResult["actions"];
};

export function buildMomentInspectorWorkspacePanelResolver(params: {
  panelProps: MomentInspectorWorkspacePanelProps;
  panelState: MomentInspectorWorkspacePanelStateResult;
}): MomentInspectorWorkspacePanelResolverResult {
  return {
    context: buildMomentInspectorWorkspacePanelContext({
      panelProps: params.panelProps,
      derivedState: params.panelState.state,
      runtime: params.panelState.runtime,
    }),
    actions: params.panelState.actions,
  };
}