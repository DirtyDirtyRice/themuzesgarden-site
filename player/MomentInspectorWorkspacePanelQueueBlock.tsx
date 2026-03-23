"use client";

import MomentInspectorWorkspaceQueueBody from "./MomentInspectorWorkspaceQueueBody";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspacePanelViewModel } from "./momentInspectorWorkspacePanelViewModel";

type Props = {
  lane: MomentInspectorWorkspaceLane;
  searchQuery: string;
  viewModel: MomentInspectorWorkspacePanelViewModel;
  selectedFamilyIds: string[];
  onToggleSelected: (familyId: string) => void;
};

export default function MomentInspectorWorkspacePanelQueueBlock(
  props: Props
) {
  const {
    lane,
    searchQuery,
    viewModel,
    selectedFamilyIds,
    onToggleSelected,
  } = props;

  return (
    <MomentInspectorWorkspaceQueueBody
      lane={lane}
      searchQuery={searchQuery}
      viewModel={viewModel}
      selectedFamilyIds={selectedFamilyIds}
      onToggleSelected={onToggleSelected}
    />
  );
}