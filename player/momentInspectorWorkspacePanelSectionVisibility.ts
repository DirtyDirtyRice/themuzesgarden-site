import type { MomentInspectorWorkspacePanelContext } from "./momentInspectorWorkspacePanelContext";
import type { MomentInspectorWorkspacePanelLayoutSection } from "./momentInspectorWorkspacePanelLayout";

export type MomentInspectorWorkspacePanelSectionVisibility = Record<
  MomentInspectorWorkspacePanelLayoutSection,
  boolean
>;

export function buildMomentInspectorWorkspacePanelSectionVisibility(
  context: MomentInspectorWorkspacePanelContext
): MomentInspectorWorkspacePanelSectionVisibility {
  const hasSelection = context.composer.viewModel.selectionSummary.hasSelection;
  const hasAnyFamilies = context.derivedState.totalCount > 0;

  return {
    header: true,
    toolbar: true,
    selection: hasSelection || hasAnyFamilies,
    queue: true,
  };
}