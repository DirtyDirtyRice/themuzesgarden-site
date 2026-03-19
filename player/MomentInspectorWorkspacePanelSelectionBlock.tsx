"use client";

import MomentInspectorWorkspaceSelectionBar from "./MomentInspectorWorkspaceSelectionBar";

type MomentInspectorWorkspacePanelSelectionBlockProps = {
  label: string;
  hasSelection: boolean;
  onClearSelection: () => void;
};

export default function MomentInspectorWorkspacePanelSelectionBlock(
  props: MomentInspectorWorkspacePanelSelectionBlockProps
) {
  return (
    <MomentInspectorWorkspaceSelectionBar
      label={props.label}
      hasSelection={props.hasSelection}
      onClearSelection={props.onClearSelection}
    />
  );
}