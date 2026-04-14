"use client";

import UniversalPanelHost from "./UniversalPanelHost";
import type { ProjectWorkspacePanelSystem } from "./useProjectWorkspacePanelSystem";

type Props = {
  panelSystem: ProjectWorkspacePanelSystem;
  className?: string;
};

export default function ProjectWorkspaceUniversalPanels({
  panelSystem,
  className,
}: Props) {
  return (
    <UniversalPanelHost
      manager={panelSystem.manager}
      registry={panelSystem.registry}
      className={className}
    />
  );
}