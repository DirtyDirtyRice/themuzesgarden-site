"use client";

import type { ComponentProps } from "react";
import MomentInspectorWorkspaceQueueBody from "./MomentInspectorWorkspaceQueueBody";

type Props = ComponentProps<typeof MomentInspectorWorkspaceQueueBody>;

export default function MomentInspectorWorkspacePanelQueueBlock(
  props: Props
) {
  return <MomentInspectorWorkspaceQueueBody {...props} />;
}