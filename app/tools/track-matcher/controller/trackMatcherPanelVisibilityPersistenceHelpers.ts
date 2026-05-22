import type {
  TrackMatcherPanelRegistryId,
  TrackMatcherPanelRegistryItem,
  TrackMatcherPanelRegistryVisibility,
} from "./trackMatcherPanelRegistryTypes";
import type {
  TrackMatcherPanelVisibilityPersistencePatch,
  TrackMatcherPanelVisibilityPersistenceRecord,
  TrackMatcherPanelVisibilityPersistenceReconciliation,
  TrackMatcherPanelVisibilityPersistenceSnapshot,
  TrackMatcherPanelVisibilityPersistenceSource,
  TrackMatcherPanelVisibilityPersistenceStorageEnvelope,
  TrackMatcherPanelVisibilityPersistenceSummary,
} from "./trackMatcherPanelVisibilityPersistenceTypes";

const DEFAULT_VISIBILITY: TrackMatcherPanelRegistryVisibility = "visible";
const STORAGE_VERSION = 1;

function getIsoNow() {
  return new Date().toISOString();
}

function createSnapshotId(createdAtIso: string, totalRecords: number) {
  return `track-matcher-panel-visibility-${createdAtIso}-${totalRecords}`;
}

function getPanelVisibility(panel: TrackMatcherPanelRegistryItem) {
  return panel.visibility ?? DEFAULT_VISIBILITY;
}

function isCollapsedFromVisibility(
  visibility: TrackMatcherPanelRegistryVisibility,
  defaultCollapsed: boolean,
) {
  return visibility === "collapsed" || defaultCollapsed;
}

function isHiddenFromStackFromVisibility(
  visibility: TrackMatcherPanelRegistryVisibility,
) {
  return visibility === "hidden-from-stack";
}

function normalizeRecordFlags(
  record: TrackMatcherPanelVisibilityPersistenceRecord,
): TrackMatcherPanelVisibilityPersistenceRecord {
  const defaultCollapsed = record.defaultCollapsed === true;
  const visibility = record.visibility ?? DEFAULT_VISIBILITY;

  return {
    ...record,
    visibility,
    isCollapsed: isCollapsedFromVisibility(visibility, defaultCollapsed),
    isHiddenFromStack: isHiddenFromStackFromVisibility(visibility),
    canUserHide: record.canUserHide === true,
    canUserCollapse: record.canUserCollapse === true,
    defaultCollapsed,
    updatedAtIso: record.updatedAtIso || getIsoNow(),
  };
}

function sortRecords(
  records: readonly TrackMatcherPanelVisibilityPersistenceRecord[],
) {
  return [...records].sort((a, b) =>
    String(a.panelId).localeCompare(String(b.panelId)),
  );
}

function sortPanelIds(panelIds: readonly TrackMatcherPanelRegistryId[]) {
  return [...panelIds].sort((a, b) => String(a).localeCompare(String(b)));
}

function uniquePanelIds(
  panelIds: readonly TrackMatcherPanelRegistryId[],
): TrackMatcherPanelRegistryId[] {
  return sortPanelIds([...new Set(panelIds)]);
}

export function createTrackMatcherPanelVisibilityPersistenceRecord(
  panel: TrackMatcherPanelRegistryItem,
  source: TrackMatcherPanelVisibilityPersistenceSource = "default",
): TrackMatcherPanelVisibilityPersistenceRecord {
  const visibility = getPanelVisibility(panel);
  const defaultCollapsed = panel.defaultCollapsed === true;

  return normalizeRecordFlags({
    panelId: panel.id,
    visibility,
    isCollapsed: isCollapsedFromVisibility(visibility, defaultCollapsed),
    isHiddenFromStack: isHiddenFromStackFromVisibility(visibility),
    canUserHide: panel.canUserHide === true,
    canUserCollapse: panel.canUserCollapse === true,
    defaultCollapsed,
    updatedAtIso: getIsoNow(),
    source,
  });
}

export function createTrackMatcherPanelVisibilityPersistenceSnapshot(
  registry: readonly TrackMatcherPanelRegistryItem[],
  label = "Current Track Matcher panel visibility",
): TrackMatcherPanelVisibilityPersistenceSnapshot {
  const createdAtIso = getIsoNow();
  const records = sortRecords(
    registry.map((panel) =>
      createTrackMatcherPanelVisibilityPersistenceRecord(panel, "default"),
    ),
  );

  return {
    snapshotId: createSnapshotId(createdAtIso, records.length),
    createdAtIso,
    label,
    records,
  };
}

export function summarizeTrackMatcherPanelVisibilityPersistenceSnapshot(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceSummary {
  let visibleRecords = 0;
  let collapsedRecords = 0;
  let hiddenFromStackRecords = 0;
  let userRecords = 0;
  let defaultRecords = 0;
  let snapshotRecords = 0;
  let migrationRecords = 0;
  let userHideableRecords = 0;
  let userCollapsibleRecords = 0;
  let defaultCollapsedRecords = 0;

  for (const record of snapshot.records) {
    if (record.visibility === "visible") visibleRecords += 1;
    if (record.visibility === "collapsed") collapsedRecords += 1;
    if (record.visibility === "hidden-from-stack") hiddenFromStackRecords += 1;
    if (record.source === "user") userRecords += 1;
    if (record.source === "default") defaultRecords += 1;
    if (record.source === "snapshot") snapshotRecords += 1;
    if (record.source === "migration") migrationRecords += 1;
    if (record.canUserHide) userHideableRecords += 1;
    if (record.canUserCollapse) userCollapsibleRecords += 1;
    if (record.defaultCollapsed) defaultCollapsedRecords += 1;
  }

  return {
    snapshotId: snapshot.snapshotId,
    createdAtIso: snapshot.createdAtIso,
    label: snapshot.label,
    totalRecords: snapshot.records.length,
    visibleRecords,
    collapsedRecords,
    hiddenFromStackRecords,
    userRecords,
    defaultRecords,
    snapshotRecords,
    migrationRecords,
    userHideableRecords,
    userCollapsibleRecords,
    defaultCollapsedRecords,
  };
}

export function getTrackMatcherPanelVisibilityPersistenceRecordIds(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
) {
  return snapshot.records.map((record) => record.panelId);
}

export function findTrackMatcherPanelVisibilityPersistenceRecord(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
  panelId: TrackMatcherPanelRegistryId,
) {
  return snapshot.records.find((record) => record.panelId === panelId) ?? null;
}

export function getTrackMatcherPanelVisibilityPersistenceDuplicateIds(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelRegistryId[] {
  const seen = new Set<TrackMatcherPanelRegistryId>();
  const duplicates: TrackMatcherPanelRegistryId[] = [];

  for (const record of snapshot.records) {
    if (seen.has(record.panelId)) {
      duplicates.push(record.panelId);
    }

    seen.add(record.panelId);
  }

  return uniquePanelIds(duplicates);
}

export function mergeTrackMatcherPanelVisibilityPersistenceRecords(
  baseRecords: readonly TrackMatcherPanelVisibilityPersistenceRecord[],
  nextRecords: readonly TrackMatcherPanelVisibilityPersistenceRecord[],
) {
  const merged = new Map<
    TrackMatcherPanelRegistryId,
    TrackMatcherPanelVisibilityPersistenceRecord
  >();

  for (const record of baseRecords) {
    merged.set(record.panelId, normalizeRecordFlags(record));
  }

  for (const record of nextRecords) {
    merged.set(record.panelId, normalizeRecordFlags(record));
  }

  return sortRecords([...merged.values()]);
}

export function applyTrackMatcherPanelVisibilityPersistencePatch(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
  patch: TrackMatcherPanelVisibilityPersistencePatch,
): TrackMatcherPanelVisibilityPersistenceSnapshot {
  const updatedAtIso = patch.updatedAtIso ?? getIsoNow();
  const records = snapshot.records.map((record) => {
    if (record.panelId !== patch.panelId) return record;

    return normalizeRecordFlags({
      ...record,
      visibility: patch.visibility ?? record.visibility,
      isCollapsed: patch.isCollapsed ?? record.isCollapsed,
      isHiddenFromStack: patch.isHiddenFromStack ?? record.isHiddenFromStack,
      source: patch.source ?? "user",
      updatedAtIso,
    });
  });

  return {
    ...snapshot,
    records: sortRecords(records),
  };
}

export function applyTrackMatcherPanelVisibilityPersistencePatches(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
  patches: readonly TrackMatcherPanelVisibilityPersistencePatch[],
): TrackMatcherPanelVisibilityPersistenceSnapshot {
  return patches.reduce(
    (nextSnapshot, patch) =>
      applyTrackMatcherPanelVisibilityPersistencePatch(nextSnapshot, patch),
    snapshot,
  );
}

export function reconcileTrackMatcherPanelVisibilityPersistenceSnapshot(
  registry: readonly TrackMatcherPanelRegistryItem[],
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceReconciliation {
  const registryPanelIds = uniquePanelIds(registry.map((panel) => panel.id));
  const snapshotPanelIds = uniquePanelIds(
    snapshot.records.map((record) => record.panelId),
  );
  const registryIdSet = new Set(registryPanelIds);
  const snapshotIdSet = new Set(snapshotPanelIds);

  return {
    snapshotPanelIds,
    registryPanelIds,
    missingFromSnapshot: registryPanelIds.filter(
      (panelId) => !snapshotIdSet.has(panelId),
    ),
    missingFromRegistry: snapshotPanelIds.filter(
      (panelId) => !registryIdSet.has(panelId),
    ),
    duplicateSnapshotPanelIds:
      getTrackMatcherPanelVisibilityPersistenceDuplicateIds(snapshot),
  };
}

export function repairTrackMatcherPanelVisibilityPersistenceSnapshotFromRegistry(
  registry: readonly TrackMatcherPanelRegistryItem[],
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceSnapshot {
  const existingRecords = new Map<
    TrackMatcherPanelRegistryId,
    TrackMatcherPanelVisibilityPersistenceRecord
  >();

  for (const record of snapshot.records) {
    existingRecords.set(record.panelId, normalizeRecordFlags(record));
  }

  const records = registry.map((panel) => {
    const existingRecord = existingRecords.get(panel.id);

    if (existingRecord) {
      return normalizeRecordFlags(existingRecord);
    }

    return createTrackMatcherPanelVisibilityPersistenceRecord(
      panel,
      "migration",
    );
  });

  return {
    ...snapshot,
    records: sortRecords(records),
  };
}

export function createTrackMatcherPanelVisibilityPersistenceStorageEnvelope(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
): TrackMatcherPanelVisibilityPersistenceStorageEnvelope {
  return {
    version: STORAGE_VERSION,
    savedAtIso: getIsoNow(),
    snapshot,
  };
}

export function serializeTrackMatcherPanelVisibilityPersistenceSnapshot(
  snapshot: TrackMatcherPanelVisibilityPersistenceSnapshot,
) {
  return JSON.stringify(
    createTrackMatcherPanelVisibilityPersistenceStorageEnvelope(snapshot),
    null,
    2,
  );
}

export function parseTrackMatcherPanelVisibilityPersistenceSnapshot(
  rawValue: string,
): TrackMatcherPanelVisibilityPersistenceSnapshot | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<
      TrackMatcherPanelVisibilityPersistenceStorageEnvelope
    >;

    if (parsed.version !== STORAGE_VERSION || !parsed.snapshot) {
      return null;
    }

    return {
      ...parsed.snapshot,
      records: sortRecords(
        (parsed.snapshot.records ?? []).map((record) =>
          normalizeRecordFlags(record),
        ),
      ),
    };
  } catch {
    return null;
  }
}
