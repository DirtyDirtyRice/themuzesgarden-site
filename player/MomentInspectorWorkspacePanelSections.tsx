"use client";

import MomentInspectorWorkspaceContent from "./MomentInspectorWorkspaceContent";

export default function MomentInspectorWorkspacePanelSections({
  context,
}: any) {
  const groups =
    context?.composer?.viewModel?.derivedView?.lanes ?? [];

  return (
    <MomentInspectorWorkspaceContent groups={groups} />
  );
}