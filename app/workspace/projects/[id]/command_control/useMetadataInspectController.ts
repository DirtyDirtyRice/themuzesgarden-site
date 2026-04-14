"use client";

import { useState } from "react";
import { createPanelState } from "./panelActions";
import type { PanelState } from "./panelTypes";

export function useMetadataInspectController() {
  const [panel, setPanel] = useState<PanelState | null>(null);

  function openMetadataPanel(trackId: string, title: string) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const next = createPanelState(
      {
        id: `metadata-${trackId}`,
        kind: "metadata-inspect",
        title,
        target: { trackId },
      },
      viewport
    );

    setPanel(next);
  }

  function closePanel() {
    setPanel(null);
  }

  return {
    panel,
    openMetadataPanel,
    closePanel,
  };
}