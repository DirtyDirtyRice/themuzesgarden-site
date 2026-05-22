import type { TrackMatcherPanelRegistryItem } from "./trackMatcherPanelRegistryTypes";
import {
  getTrackMatcherPanelVisibilityPersistenceDuplicateIds,
  reconcileTrackMatcherPanelVisibilityPersistenceSnapshot,
  summarizeTrackMatcherPanelVisibilityPersistenceSnapshot,
} from "./trackMatcherPanelVisibilityPersistenceHelpers";
import type {
  TrackMatcherPanelVisibilityPersistenceDiagnostic,
  TrackMatcherPanelVisibilityPersistenceSnapshot,
} from "./trackMatcherPanelVisibilityPersistenceTypes";

function createDiagnostic(
  level: TrackMatcherPanelVisibilityPersistenceDiagnostic["level"],
  title: string,
  message: string,
): TrackMatcherPanelVisibilityPersistenceDiagnostic {
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

export function getTrackMatcherPanelVisibilityPersistenceDiagnostics(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceDiagnostic[] {
  const diagnostics: TrackMatcherPanelVisibilityPersistenceDiagnostic[] = [];
  const summary = summarizeTrackMatcherPanelVisibilityPersistenceSnapshot(snapshot);
  const duplicateIds =
    getTrackMatcherPanelVisibilityPersistenceDuplicateIds(snapshot);

  if (summary.totalRecords === 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "No visibility records",
        "The visibility persistence snapshot does not contain any panel records.",
      ),
    );
  }

  if (!snapshot.snapshotId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing snapshot id",
        "The visibility persistence snapshot does not include a snapshotId.",
      ),
    );
  }

  if (!isValidIsoDate(snapshot.createdAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid snapshot timestamp",
        "The visibility persistence snapshot createdAtIso value is missing or invalid.",
      ),
    );
  }

  for (const duplicateId of duplicateIds) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate visibility record",
        `Panel ${duplicateId} appears more than once in the visibility persistence snapshot.`,
      ),
    );
  }

  for (const record of snapshot.records) {
    if (!isValidIsoDate(record.updatedAtIso)) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Invalid visibility timestamp",
          `Panel ${record.panelId} has a missing or invalid updatedAtIso value.`,
        ),
      );
    }

    if (record.visibility === "collapsed" && record.isHiddenFromStack) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Conflicting visibility flags",
          `Panel ${record.panelId} is collapsed and hidden from stack at the same time.`,
        ),
      );
    }

    if (record.visibility === "hidden-from-stack" && !record.isHiddenFromStack) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Hidden visibility flag mismatch",
          `Panel ${record.panelId} has hidden-from-stack visibility but isHiddenFromStack is false.`,
        ),
      );
    }

    if (record.visibility === "visible" && record.isHiddenFromStack) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "Visible panel hidden from stack",
          `Panel ${record.panelId} is visible but still marked hidden from stack.`,
        ),
      );
    }

    if (record.isCollapsed && !record.canUserCollapse && record.source === "user") {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "User collapse not allowed",
          `Panel ${record.panelId} has a user collapse state but canUserCollapse is false.`,
        ),
      );
    }

    if (record.visibility === "hidden-from-stack" && !record.canUserHide) {
      diagnostics.push(
        createDiagnostic(
          "warning",
          "User hide not allowed",
          `Panel ${record.panelId} is hidden from stack but canUserHide is false.`,
        ),
      );
    }
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "Visibility persistence healthy",
        `Validated ${summary.totalRecords} visibility persistence records.`,
      ),
    );
  }

  return diagnostics;
}

export function getTrackMatcherPanelVisibilityPersistenceRegistryDiagnostics(
  registry: readonly TrackMatcherPanelRegistryItem[],
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceDiagnostic[] {
  const diagnostics = getTrackMatcherPanelVisibilityPersistenceDiagnostics(snapshot);
  const reconciliation = reconcileTrackMatcherPanelVisibilityPersistenceSnapshot(
    registry,
    snapshot,
  );

  for (const panelId of reconciliation.missingFromSnapshot) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Panel missing from visibility snapshot",
        `Panel ${panelId} exists in the registry but has no visibility persistence record.`,
      ),
    );
  }

  for (const panelId of reconciliation.missingFromRegistry) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Visibility record missing registry panel",
        `Panel ${panelId} exists in the visibility snapshot but not in the registry.`,
      ),
    );
  }

  return diagnostics;
}

export function hasTrackMatcherPanelVisibilityPersistenceErrors(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
) {
  return getTrackMatcherPanelVisibilityPersistenceDiagnostics(snapshot).some(
    (diagnostic) => diagnostic.level === "error",
  );
}

export function hasTrackMatcherPanelVisibilityPersistenceRegistryErrors(
  registry: readonly TrackMatcherPanelRegistryItem[],
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
) {
  return getTrackMatcherPanelVisibilityPersistenceRegistryDiagnostics(
    registry,
    snapshot,
  ).some((diagnostic) => diagnostic.level === "error");
}
