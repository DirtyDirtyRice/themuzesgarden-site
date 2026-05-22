"use client";

import type {
  TrackMatcherPanelRegistryDiagnostic,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryValidationResult,
} from "./trackMatcherPanelRegistryTypes";
import { TRACK_MATCHER_PANEL_ZONE_ORDER } from "./trackMatcherPanelRegistryTypes";

type TrackMatcherPanelDiagnosticLevel =
  TrackMatcherPanelRegistryDiagnostic["level"];

type TrackMatcherPanelDiagnosticCounter = {
  ok: number;
  warning: number;
  error: number;
};

function createDiagnostic(
  level: TrackMatcherPanelDiagnosticLevel,
  title: string,
  message: string,
): TrackMatcherPanelRegistryDiagnostic {
  return { level, title, message };
}

function createOkDiagnostic(
  title: string,
  message: string,
): TrackMatcherPanelRegistryDiagnostic {
  return createDiagnostic("ok", title, message);
}

function createWarningDiagnostic(
  title: string,
  message: string,
): TrackMatcherPanelRegistryDiagnostic {
  return createDiagnostic("warning", title, message);
}

function createErrorDiagnostic(
  title: string,
  message: string,
): TrackMatcherPanelRegistryDiagnostic {
  return createDiagnostic("error", title, message);
}

function getTrackMatcherPanelIdentity(panel: TrackMatcherPanelRegistryItem) {
  return `${panel.zone}:${panel.order}:${panel.id}`;
}

function isTrackMatcherPanelOrderValid(order: number) {
  return Number.isFinite(order) && order >= 0;
}

function isTrackMatcherPanelTitleValid(title: string) {
  return title.trim().length > 0;
}

function isTrackMatcherPanelDescriptionValid(description: string) {
  return description.trim().length > 0;
}

export function findTrackMatcherPanelDuplicateIds(
  panels: TrackMatcherPanelRegistryItem[],
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const panel of panels) {
    if (seen.has(panel.id)) {
      duplicates.add(panel.id);
    }

    seen.add(panel.id);
  }

  return [...duplicates];
}

export function findTrackMatcherPanelDuplicateOrders(
  panels: TrackMatcherPanelRegistryItem[],
) {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];

  for (const panel of panels) {
    const orderKey = `${panel.zone}:${panel.order}`;
    const previous = seen.get(orderKey);

    if (previous) {
      duplicates.push(`${orderKey} used by ${previous} and ${panel.id}`);
    }

    seen.set(orderKey, panel.id);
  }

  return duplicates;
}

export function findTrackMatcherPanelUnknownZones(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels
    .filter((panel) => !TRACK_MATCHER_PANEL_ZONE_ORDER.includes(panel.zone))
    .map((panel) => panel.id);
}

export function findTrackMatcherPanelInvalidOrders(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels
    .filter((panel) => !isTrackMatcherPanelOrderValid(panel.order))
    .map((panel) => getTrackMatcherPanelIdentity(panel));
}

export function findTrackMatcherPanelMissingTitles(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels
    .filter((panel) => !isTrackMatcherPanelTitleValid(panel.title))
    .map((panel) => getTrackMatcherPanelIdentity(panel));
}

export function findTrackMatcherPanelMissingDescriptions(
  panels: TrackMatcherPanelRegistryItem[],
) {
  return panels
    .filter((panel) => !isTrackMatcherPanelDescriptionValid(panel.description))
    .map((panel) => getTrackMatcherPanelIdentity(panel));
}

export function countTrackMatcherPanelDiagnostics(
  diagnostics: TrackMatcherPanelRegistryDiagnostic[],
): TrackMatcherPanelDiagnosticCounter {
  return diagnostics.reduce<TrackMatcherPanelDiagnosticCounter>(
    (counts, diagnostic) => ({
      ...counts,
      [diagnostic.level]: counts[diagnostic.level] + 1,
    }),
    {
      ok: 0,
      warning: 0,
      error: 0,
    },
  );
}

export function hasTrackMatcherPanelRegistryErrors(
  diagnostics: TrackMatcherPanelRegistryDiagnostic[],
) {
  return diagnostics.some((diagnostic) => diagnostic.level === "error");
}

export function hasTrackMatcherPanelRegistryWarnings(
  diagnostics: TrackMatcherPanelRegistryDiagnostic[],
) {
  return diagnostics.some((diagnostic) => diagnostic.level === "warning");
}

export function validateTrackMatcherPanelRegistry(
  panels: TrackMatcherPanelRegistryItem[],
): TrackMatcherPanelRegistryValidationResult {
  const diagnostics: TrackMatcherPanelRegistryDiagnostic[] = [];
  const duplicateIds = findTrackMatcherPanelDuplicateIds(panels);
  const duplicateOrders = findTrackMatcherPanelDuplicateOrders(panels);
  const unknownZones = findTrackMatcherPanelUnknownZones(panels);
  const invalidOrders = findTrackMatcherPanelInvalidOrders(panels);
  const missingTitles = findTrackMatcherPanelMissingTitles(panels);
  const missingDescriptions = findTrackMatcherPanelMissingDescriptions(panels);

  if (duplicateIds.length > 0) {
    diagnostics.push(
      createErrorDiagnostic(
        "Duplicate panel ids",
        `Duplicate panel ids found: ${duplicateIds.join(", ")}.`,
      ),
    );
  }

  if (unknownZones.length > 0) {
    diagnostics.push(
      createErrorDiagnostic(
        "Unknown panel zones",
        `Panels with unknown zones: ${unknownZones.join(", ")}.`,
      ),
    );
  }

  if (invalidOrders.length > 0) {
    diagnostics.push(
      createErrorDiagnostic(
        "Invalid panel order values",
        `Panels with invalid order values: ${invalidOrders.join(", ")}.`,
      ),
    );
  }

  if (duplicateOrders.length > 0) {
    diagnostics.push(
      createWarningDiagnostic(
        "Duplicate panel order slots",
        duplicateOrders.join("; "),
      ),
    );
  }

  if (missingTitles.length > 0) {
    diagnostics.push(
      createWarningDiagnostic(
        "Missing panel titles",
        `Panels with missing titles: ${missingTitles.join(", ")}.`,
      ),
    );
  }

  if (missingDescriptions.length > 0) {
    diagnostics.push(
      createWarningDiagnostic(
        "Missing panel descriptions",
        `Panels with missing descriptions: ${missingDescriptions.join(", ")}.`,
      ),
    );
  }

  if (panels.length === 0) {
    diagnostics.push(
      createWarningDiagnostic(
        "Empty panel registry",
        "The panel registry has no panels registered yet.",
      ),
    );
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createOkDiagnostic(
        "Panel registry healthy",
        "No duplicate ids, no unknown zones, no invalid orders, and no order conflicts were detected.",
      ),
    );
  }

  return {
    ok: !hasTrackMatcherPanelRegistryErrors(diagnostics),
    diagnostics,
  };
}

export function createTrackMatcherPanelRegistryDiagnosticSummary(
  diagnostics: TrackMatcherPanelRegistryDiagnostic[],
) {
  const counts = countTrackMatcherPanelDiagnostics(diagnostics);

  return {
    ...counts,
    total: diagnostics.length,
    ok: counts.error === 0,
    hasWarnings: counts.warning > 0,
    hasErrors: counts.error > 0,
  };
}

export function getTrackMatcherPanelDiagnosticTone(
  level: TrackMatcherPanelRegistryDiagnostic["level"],
) {
  switch (level) {
    case "ok":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    case "warning":
      return "border-amber-400/20 bg-amber-400/10 text-amber-100";
    case "error":
      return "border-red-400/20 bg-red-400/10 text-red-100";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

export function getTrackMatcherPanelDiagnosticLabel(
  level: TrackMatcherPanelRegistryDiagnostic["level"],
) {
  switch (level) {
    case "ok":
      return "OK";
    case "warning":
      return "Warning";
    case "error":
      return "Error";
    default:
      return "Unknown";
  }
}

export function getTrackMatcherPanelRegistryHealthLabel(
  validation: TrackMatcherPanelRegistryValidationResult,
) {
  if (!validation.ok) {
    return "Needs Fix";
  }

  if (hasTrackMatcherPanelRegistryWarnings(validation.diagnostics)) {
    return "Warnings";
  }

  return "Healthy";
}
