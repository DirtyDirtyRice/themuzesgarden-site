"use client";

import type { ReactNode } from "react";

type MomentInspectorWorkspacePanelScaffoldProps = {
  children: ReactNode;
};

export default function MomentInspectorWorkspacePanelScaffold(
  props: MomentInspectorWorkspacePanelScaffoldProps
) {
  return <div className="space-y-3">{props.children}</div>;
}