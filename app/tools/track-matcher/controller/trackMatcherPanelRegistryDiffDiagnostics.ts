import {
  summarizeTrackMatcherPanelRegistryDiffResult,
} from "./trackMatcherPanelRegistryDiffHelpers";
import type {
  TrackMatcherPanelRegistryDiffDiagnostic,
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSnapshotLike,
} from "./trackMatcherPanelRegistryDiffTypes";

function createDiagnostic(
  level: TrackMatcherPanelRegistryDiffDiagnostic["level"],
  title: string,
  message: string,
): TrackMatcherPanelRegistryDiffDiagnostic {
  return {
    level,
    title,
    message,
  };
}

function isValidIsoDate(value: string) {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

function getDuplicatePanelIds(snapshot: TrackMatcherPanelRegistryDiffSnapshotLike) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const panel of snapshot.panels) {
    if (seen.has(panel.id)) {
      duplicates.add(panel.id);
    }

    seen.add(panel.id);
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b));
}

export function getTrackMatcherPanelRegistryDiffSnapshotDiagnostics(
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
): TrackMatcherPanelRegistryDiffDiagnostic[] {
  const diagnostics: TrackMatcherPanelRegistryDiffDiagnostic[] = [];
  const duplicatePanelIds = getDuplicatePanelIds(snapshot);

  if (!snapshot.snapshotId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing diff snapshot id",
        "The registry diff snapshot does not include a snapshotId.",
      ),
    );
  }

  if (!snapshot.label) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Missing diff snapshot label",
        "The registry diff snapshot does not include a label.",
      ),
    );
  }

  if (!isValidIsoDate(snapshot.createdAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid diff snapshot timestamp",
        "The registry diff snapshot createdAtIso value is missing or invalid.",
      ),
    );
  }

  if (snapshot.panels.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Empty diff snapshot",
        "The registry diff snapshot does not contain any panels.",
      ),
    );
  }

  for (const panelId of duplicatePanelIds) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate diff snapshot panel",
        `Panel ${panelId} appears more than once in the registry diff snapshot.`,
      ),
    );
  }

  for (const panel of snapshot.panels) {
    if (!panel.title.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Missing panel title",
          `Panel ${panel.id} has an empty title in the registry diff snapshot.`,
        ),
      );
    }

    if (!panel.description.trim()) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Missing panel description",
          `Panel ${panel.id} has an empty description in the registry diff snapshot.`,
        ),
      );
    }

    if (!Number.isFinite(panel.order)) {
      diagnostics.push(
        createDiagnostic(
          "error",
          "Invalid panel order",
          `Panel ${panel.id} has a non-finite order value in the registry diff snapshot.`,
        ),
      );
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "Registry diff snapshot healthy",
        `Validated ${snapshot.panels.length} panels in ${snapshot.snapshotId}.`,
      ),
    );
  }

  return diagnostics;
}

export function getTrackMatcherPanelRegistryDiffResultDiagnostics(
  result: TrackMatcherPanelRegistryDiffResult,
): TrackMatcherPanelRegistryDiffDiagnostic[] {
  const diagnostics: TrackMatcherPanelRegistryDiffDiagnostic[] = [];
  const summary = summarizeTrackMatcherPanelRegistryDiffResult(result);

  if (!result.beforeSnapshotId || !result.afterSnapshotId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing diff result snapshot ids",
        "The registry diff result does not include both before and after snapshot ids.",
      ),
    );
  }

  if (!isValidIsoDate(result.comparedAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid diff comparison timestamp",
        "The registry diff result comparedAtIso value is missing or invalid.",
      ),
    );
  }

  if (summary.breakingChanges > 0) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Breaking registry diff detected",
        `${summary.breakingChanges} breaking registry change(s) were found.`,
      ),
    );
  }

  if (summary.warningChanges > 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Registry diff warnings detected",
        `${summary.warningChanges} warning-level registry change(s) were found.`,
      ),
    );
  }

  if (summary.totalChanges === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "No registry changes",
        "The compared registry snapshots are equivalent.",
      ),
    );
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "Registry diff healthy",
        `Found ${summary.totalChanges} non-breaking registry change(s).`,
      ),
    );
  }

  return diagnostics;
}

export function hasTrackMatcherPanelRegistryDiffSnapshotErrors(
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
) {
  return getTrackMatcherPanelRegistryDiffSnapshotDiagnostics(snapshot).some(
    (diagnostic) => diagnostic.level === "error",
  );
}

export function hasTrackMatcherPanelRegistryDiffResultErrors(
  result: TrackMatcherPanelRegistryDiffResult,
) {
  return getTrackMatcherPanelRegistryDiffResultDiagnostics(result).some(
    (diagnostic) => diagnostic.level === "error",
  );
}
