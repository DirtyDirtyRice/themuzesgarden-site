"use client";

import type { ReactNode } from "react";
import type { UseUniversalPanelManagerReturn } from "./useUniversalPanelManager";
import type {
  UniversalPanelRegistrationMap,
  UniversalPanelRegistration,
} from "./panelRenderTypes";
import {
  getUniversalPanelRegistration,
  mergeUniversalPanelRenderFlags,
  resolveUniversalPanelTitle,
} from "./panelRenderTypes";

type Props = {
  manager: UseUniversalPanelManagerReturn;
  registry: UniversalPanelRegistrationMap;
  className?: string;
  emptyState?: ReactNode;
};

function joinClassNames(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

function renderPanel(
  registration: UniversalPanelRegistration,
  manager: UseUniversalPanelManagerReturn,
  instanceId: string,
  isActive: boolean
): ReactNode {
  const panel = manager.getPanel(instanceId);
  if (!panel) return null;

  const nextTitle = resolveUniversalPanelTitle(registration, panel);

  if (nextTitle !== panel.title) {
    const titlePatch = nextTitle;
    queueMicrotask(() => {
      const latest = manager.getPanel(instanceId);
      if (!latest) return;
      if (latest.title === titlePatch) return;
      manager.patchPanel(instanceId, { title: titlePatch });
    });
  }

  return registration.render({
    panel,
    manager,
    active: isActive,
  });
}

export default function UniversalPanelHost({
  manager,
  registry,
  className,
  emptyState = null,
}: Props) {
  const openPanels = manager.openPanels;

  if (!openPanels.length) {
    return emptyState ? <>{emptyState}</> : null;
  }

  const activePanelId =
    openPanels.length > 0
      ? openPanels[openPanels.length - 1]?.instanceId ?? null
      : null;

  return (
    <div className={joinClassNames("pointer-events-none absolute inset-0", className)}>
      {openPanels.map((panel) => {
        const registration = getUniversalPanelRegistration(
          registry,
          panel.panelType
        );

        if (!registration) return null;

        const flags = mergeUniversalPanelRenderFlags(registration.flags);

        const body = renderPanel(
          registration,
          manager,
          panel.instanceId,
          activePanelId === panel.instanceId
        );

        if (!body) return null;

        return (
          <div
            key={panel.instanceId}
            className={joinClassNames(
              "pointer-events-auto absolute inset-0",
              flags.reserveForAdmin && "data-admin-only"
            )}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}