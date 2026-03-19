import { buildMomentInspectorWorkspacePanelComposer } from "./momentInspectorWorkspacePanelComposer";
import { buildMomentInspectorWorkspacePanelLayout } from "./momentInspectorWorkspacePanelLayout";
import type { MomentInspectorWorkspacePanelProps } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspacePanelRuntime } from "./momentInspectorWorkspacePanel.types";
import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspacePanelContext = {
  panelProps: MomentInspectorWorkspacePanelProps;
  derivedState: MomentInspectorWorkspaceDerivedState;
  runtime: MomentInspectorWorkspacePanelRuntime;
  composer: ReturnType<typeof buildMomentInspectorWorkspacePanelComposer>;
  layout: ReturnType<typeof buildMomentInspectorWorkspacePanelLayout>;
};

export function buildMomentInspectorWorkspacePanelContext(params: {
  panelProps: MomentInspectorWorkspacePanelProps;
  derivedState: MomentInspectorWorkspaceDerivedState;
  runtime: MomentInspectorWorkspacePanelRuntime;
}): MomentInspectorWorkspacePanelContext {
  return {
    panelProps: params.panelProps,
    derivedState: params.derivedState,
    runtime: params.runtime,
    composer: buildMomentInspectorWorkspacePanelComposer({
      state: params.derivedState,
      filters: params.runtime.filters,
      groupMode: params.runtime.groupMode,
      selection: params.runtime.selection,
    }),
    layout: buildMomentInspectorWorkspacePanelLayout(),
  };
}