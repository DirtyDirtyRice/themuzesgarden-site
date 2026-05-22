import type { TrackMatcherPanelRegistryId } from "./trackMatcherPanelRegistryTypes";
import type {
  TrackMatcherPanelRegistryDiffResult,
  TrackMatcherPanelRegistryDiffSnapshotLike,
} from "./trackMatcherPanelRegistryDiffTypes";
import type {
  TrackMatcherPanelRegistryHistoryTimeline,
} from "./trackMatcherPanelRegistryHistoryTypes";
import type {
  TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope,
  TrackMatcherPanelRegistryPersistenceArchiveResult,
  TrackMatcherPanelRegistryPersistenceEntityKind,
  TrackMatcherPanelRegistryPersistenceHistoryEnvelope,
  TrackMatcherPanelRegistryPersistenceIndex,
  TrackMatcherPanelRegistryPersistenceLoadResult,
  TrackMatcherPanelRegistryPersistenceMemoryAdapter,
  TrackMatcherPanelRegistryPersistencePrunePolicy,
  TrackMatcherPanelRegistryPersistenceRecord,
  TrackMatcherPanelRegistryPersistenceSaveResult,
  TrackMatcherPanelRegistryPersistenceSearchQuery,
  TrackMatcherPanelRegistryPersistenceStorageEnvelope,
  TrackMatcherPanelRegistryPersistenceStorageKind,
  TrackMatcherPanelRegistryPersistenceSummary,
} from "./trackMatcherPanelRegistryPersistenceTypes";

const PERSISTENCE_VERSION = 1;
const DEFAULT_STORAGE_KIND: TrackMatcherPanelRegistryPersistenceStorageKind = "memory";

export const TRACK_MATCHER_PANEL_REGISTRY_PERSISTENCE_DEFAULT_PRUNE_POLICY: TrackMatcherPanelRegistryPersistencePrunePolicy =
  {
    maxRecords: 100,
    keepArchived: false,
    keepCorrupt: true,
    keepTags: [],
  };

function getIsoNow() {
  return new Date().toISOString();
}

function safeText(value: string | undefined | null) {
  return (value ?? "").trim();
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map(safeText).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function createGeneratedId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createChecksum(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `checksum-${Math.abs(hash)}`;
}

function sortRecords(records: readonly TrackMatcherPanelRegistryPersistenceRecord[]) {
  return [...records].sort((a, b) => {
    if (a.updatedAtIso !== b.updatedAtIso) {
      return b.updatedAtIso.localeCompare(a.updatedAtIso);
    }

    return a.recordId.localeCompare(b.recordId);
  });
}

function normalizeRecord(
  record: TrackMatcherPanelRegistryPersistenceRecord,
): TrackMatcherPanelRegistryPersistenceRecord {
  const payload = safeText(record.payload);
  const checksum = safeText(record.checksum) || createChecksum(payload);
  const createdAtIso = safeText(record.createdAtIso) || getIsoNow();
  const updatedAtIso = safeText(record.updatedAtIso) || createdAtIso;

  return {
    ...record,
    recordId: safeText(record.recordId) || createGeneratedId("registry-persistence"),
    createdAtIso,
    updatedAtIso,
    label: safeText(record.label) || "Registry persistence record",
    payload,
    checksum,
    version: Number.isFinite(record.version) ? record.version : PERSISTENCE_VERSION,
    tags: uniqueStrings(record.tags),
  };
}

function normalizeIndex(
  index: TrackMatcherPanelRegistryPersistenceIndex,
): TrackMatcherPanelRegistryPersistenceIndex {
  const createdAtIso = safeText(index.createdAtIso) || getIsoNow();
  const updatedAtIso = safeText(index.updatedAtIso) || createdAtIso;

  return {
    indexId: safeText(index.indexId) || createGeneratedId("registry-persistence-index"),
    createdAtIso,
    updatedAtIso,
    records: sortRecords(index.records.map(normalizeRecord)),
  };
}

function createEntityPayload(entity: TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope) {
  return JSON.stringify(entity, null, 2);
}

function parseEntityPayload(rawValue: string): TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope>;

    if (parsed.entityKind === "diff-snapshot" && "snapshot" in parsed) {
      return parsed as TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope;
    }

    if (parsed.entityKind === "diff-result" && "diffResult" in parsed) {
      return parsed as TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope;
    }

    if (parsed.entityKind === "history-timeline" && "timeline" in parsed) {
      return parsed as TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope;
    }

    return null;
  } catch {
    return null;
  }
}

function getEntityKindFromEnvelope(
  entity: TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope,
): TrackMatcherPanelRegistryPersistenceEntityKind {
  return entity.entityKind;
}

function getSearchHaystack(record: TrackMatcherPanelRegistryPersistenceRecord) {
  return [
    record.recordId,
    record.entityKind,
    record.storageKind,
    record.status,
    record.label,
    record.payload,
    ...record.tags,
  ]
    .join(" ")
    .toLowerCase();
}

function recordMentionsPanelId(
  record: TrackMatcherPanelRegistryPersistenceRecord,
  panelId: TrackMatcherPanelRegistryId,
) {
  return record.payload.includes(`"panelId": "${panelId}"`) ||
    record.payload.includes(`"panelId":"${panelId}"`) ||
    record.payload.includes(panelId);
}

export function createTrackMatcherPanelRegistryPersistenceIndex(
  labelSeed = "track-matcher-panel-registry",
): TrackMatcherPanelRegistryPersistenceIndex {
  const createdAtIso = getIsoNow();

  return {
    indexId: createGeneratedId(`${labelSeed}-persistence-index`),
    createdAtIso,
    updatedAtIso: createdAtIso,
    records: [],
  };
}

export function createTrackMatcherPanelRegistryPersistenceMemoryAdapter(): TrackMatcherPanelRegistryPersistenceMemoryAdapter {
  const storage = new Map<string, string>();

  return {
    kind: "memory",
    read: (key) => storage.get(key) ?? null,
    write: (key, value) => {
      storage.set(key, value);
    },
    remove: (key) => {
      storage.delete(key);
    },
    keys: () => [...storage.keys()].sort((a, b) => a.localeCompare(b)),
  };
}

export function createTrackMatcherPanelRegistryPersistenceRecord(options: {
  entity: TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope;
  label: string;
  storageKind?: TrackMatcherPanelRegistryPersistenceStorageKind;
  tags?: readonly string[];
}): TrackMatcherPanelRegistryPersistenceRecord {
  const createdAtIso = getIsoNow();
  const payload = createEntityPayload(options.entity);

  return normalizeRecord({
    recordId: createGeneratedId("registry-persistence-record"),
    entityKind: getEntityKindFromEnvelope(options.entity),
    storageKind: options.storageKind ?? DEFAULT_STORAGE_KIND,
    status: "active",
    createdAtIso,
    updatedAtIso: createdAtIso,
    label: options.label,
    payload,
    checksum: createChecksum(payload),
    version: PERSISTENCE_VERSION,
    tags: uniqueStrings(options.tags ?? []),
  });
}

export function saveTrackMatcherPanelRegistryPersistenceRecord(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  record: TrackMatcherPanelRegistryPersistenceRecord,
): TrackMatcherPanelRegistryPersistenceSaveResult {
  const normalizedIndex = normalizeIndex(index);
  const normalizedRecord = normalizeRecord(record);
  const recordsById = new Map<string, TrackMatcherPanelRegistryPersistenceRecord>();

  for (const existingRecord of normalizedIndex.records) {
    recordsById.set(existingRecord.recordId, existingRecord);
  }

  recordsById.set(normalizedRecord.recordId, normalizedRecord);

  return {
    ok: true,
    record: normalizedRecord,
    message: `Saved registry persistence record ${normalizedRecord.recordId}.`,
  };
}

export function addTrackMatcherPanelRegistryPersistenceRecordToIndex(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  record: TrackMatcherPanelRegistryPersistenceRecord,
): TrackMatcherPanelRegistryPersistenceIndex {
  const normalizedIndex = normalizeIndex(index);
  const normalizedRecord = normalizeRecord(record);
  const recordsById = new Map<string, TrackMatcherPanelRegistryPersistenceRecord>();

  for (const existingRecord of normalizedIndex.records) {
    recordsById.set(existingRecord.recordId, existingRecord);
  }

  recordsById.set(normalizedRecord.recordId, normalizedRecord);

  return normalizeIndex({
    ...normalizedIndex,
    updatedAtIso: getIsoNow(),
    records: [...recordsById.values()],
  });
}

export function saveTrackMatcherPanelRegistryDiffSnapshotToPersistence(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  snapshot: TrackMatcherPanelRegistryDiffSnapshotLike,
  tags: readonly string[] = [],
): TrackMatcherPanelRegistryPersistenceIndex {
  const record = createTrackMatcherPanelRegistryPersistenceRecord({
    entity: {
      entityKind: "diff-snapshot",
      snapshot,
    },
    label: snapshot.label,
    tags: ["snapshot", ...tags],
  });

  return addTrackMatcherPanelRegistryPersistenceRecordToIndex(index, record);
}

export function saveTrackMatcherPanelRegistryDiffResultToPersistence(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  diffResult: TrackMatcherPanelRegistryDiffResult,
  tags: readonly string[] = [],
): TrackMatcherPanelRegistryPersistenceIndex {
  const record = createTrackMatcherPanelRegistryPersistenceRecord({
    entity: {
      entityKind: "diff-result",
      diffResult,
    },
    label: `Diff ${diffResult.beforeSnapshotId} to ${diffResult.afterSnapshotId}`,
    tags: ["diff", ...tags],
  });

  return addTrackMatcherPanelRegistryPersistenceRecordToIndex(index, record);
}

export function saveTrackMatcherPanelRegistryHistoryToPersistence(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  timeline: TrackMatcherPanelRegistryHistoryTimeline,
  tags: readonly string[] = [],
): TrackMatcherPanelRegistryPersistenceIndex {
  const record = createTrackMatcherPanelRegistryPersistenceRecord({
    entity: {
      entityKind: "history-timeline",
      timeline,
    },
    label: timeline.label,
    tags: ["history", ...tags],
  });

  return addTrackMatcherPanelRegistryPersistenceRecordToIndex(index, record);
}

export function findTrackMatcherPanelRegistryPersistenceRecord(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  recordId: string,
) {
  return normalizeIndex(index).records.find((record) => record.recordId === recordId) ?? null;
}

export function loadTrackMatcherPanelRegistryPersistenceEntity(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  recordId: string,
): TrackMatcherPanelRegistryPersistenceLoadResult<TrackMatcherPanelRegistryPersistenceAnyEntityEnvelope> {
  const record = findTrackMatcherPanelRegistryPersistenceRecord(index, recordId);

  if (!record) {
    return {
      ok: false,
      value: null,
      record: null,
      message: `Registry persistence record ${recordId} was not found.`,
    };
  }

  const parsed = parseEntityPayload(record.payload);

  if (!parsed) {
    return {
      ok: false,
      value: null,
      record,
      message: `Registry persistence record ${recordId} could not be parsed.`,
    };
  }

  return {
    ok: true,
    value: parsed,
    record,
    message: `Loaded registry persistence record ${recordId}.`,
  };
}

export function loadTrackMatcherPanelRegistryHistoryFromPersistence(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  recordId: string,
): TrackMatcherPanelRegistryPersistenceLoadResult<TrackMatcherPanelRegistryHistoryTimeline> {
  const loaded = loadTrackMatcherPanelRegistryPersistenceEntity(index, recordId);

  if (!loaded.ok || !loaded.value || loaded.value.entityKind !== "history-timeline") {
    return {
      ok: false,
      value: null,
      record: loaded.record,
      message: `Registry persistence record ${recordId} is not a history timeline.`,
    };
  }

  const envelope = loaded.value as TrackMatcherPanelRegistryPersistenceHistoryEnvelope;

  return {
    ok: true,
    value: envelope.timeline,
    record: loaded.record,
    message: `Loaded registry history timeline from ${recordId}.`,
  };
}

export function archiveTrackMatcherPanelRegistryPersistenceRecord(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  recordId: string,
): TrackMatcherPanelRegistryPersistenceArchiveResult {
  let found = false;
  const records = normalizeIndex(index).records.map((record) => {
    if (record.recordId !== recordId) return record;

    found = true;

    return normalizeRecord({
      ...record,
      status: "archived",
      updatedAtIso: getIsoNow(),
    });
  });

  return {
    ok: found,
    index: normalizeIndex({
      ...index,
      updatedAtIso: getIsoNow(),
      records,
    }),
    message: found
      ? `Archived registry persistence record ${recordId}.`
      : `Registry persistence record ${recordId} was not found.`,
  };
}

export function markTrackMatcherPanelRegistryPersistenceRecordCorrupt(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  recordId: string,
): TrackMatcherPanelRegistryPersistenceArchiveResult {
  let found = false;
  const records = normalizeIndex(index).records.map((record) => {
    if (record.recordId !== recordId) return record;

    found = true;

    return normalizeRecord({
      ...record,
      status: "corrupt",
      updatedAtIso: getIsoNow(),
    });
  });

  return {
    ok: found,
    index: normalizeIndex({
      ...index,
      updatedAtIso: getIsoNow(),
      records,
    }),
    message: found
      ? `Marked registry persistence record ${recordId} corrupt.`
      : `Registry persistence record ${recordId} was not found.`,
  };
}

export function searchTrackMatcherPanelRegistryPersistenceRecords(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  query: TrackMatcherPanelRegistryPersistenceSearchQuery,
) {
  const text = safeText(query.text).toLowerCase();

  return normalizeIndex(index).records.filter((record) => {
    if (query.entityKind && record.entityKind !== query.entityKind) return false;
    if (query.status && record.status !== query.status) return false;
    if (query.storageKind && record.storageKind !== query.storageKind) return false;
    if (query.tag && !record.tags.includes(query.tag)) return false;
    if (query.panelId && !recordMentionsPanelId(record, query.panelId)) return false;
    if (text && !getSearchHaystack(record).includes(text)) return false;

    return true;
  });
}

export function summarizeTrackMatcherPanelRegistryPersistenceIndex(
  index: TrackMatcherPanelRegistryPersistenceIndex,
): TrackMatcherPanelRegistryPersistenceSummary {
  const normalizedIndex = normalizeIndex(index);
  const records = normalizedIndex.records;

  return {
    indexId: normalizedIndex.indexId,
    totalRecords: records.length,
    activeRecords: records.filter((record) => record.status === "active").length,
    archivedRecords: records.filter((record) => record.status === "archived").length,
    corruptRecords: records.filter((record) => record.status === "corrupt").length,
    migratedRecords: records.filter((record) => record.status === "migrated").length,
    diffSnapshots: records.filter((record) => record.entityKind === "diff-snapshot").length,
    diffResults: records.filter((record) => record.entityKind === "diff-result").length,
    historyTimelines: records.filter((record) => record.entityKind === "history-timeline").length,
    unknownRecords: records.filter((record) => record.entityKind === "unknown").length,
    storageKinds: [...new Set(records.map((record) => record.storageKind))].sort(),
    tags: uniqueStrings(records.flatMap((record) => record.tags)),
    latestUpdatedAtIso: records[0]?.updatedAtIso ?? null,
  };
}

export function pruneTrackMatcherPanelRegistryPersistenceIndex(
  index: TrackMatcherPanelRegistryPersistenceIndex,
  policy: TrackMatcherPanelRegistryPersistencePrunePolicy =
    TRACK_MATCHER_PANEL_REGISTRY_PERSISTENCE_DEFAULT_PRUNE_POLICY,
): TrackMatcherPanelRegistryPersistenceIndex {
  const normalizedIndex = normalizeIndex(index);
  const protectedTags = new Set(policy.keepTags);
  const protectedRecords = normalizedIndex.records.filter((record) => {
    if (policy.keepArchived && record.status === "archived") return true;
    if (policy.keepCorrupt && record.status === "corrupt") return true;
    return record.tags.some((tag) => protectedTags.has(tag));
  });
  const latestRecords = normalizedIndex.records
    .filter((record) => !protectedRecords.some((protectedRecord) => protectedRecord.recordId === record.recordId))
    .slice(0, Math.max(policy.maxRecords, 0));
  const recordsById = new Map<string, TrackMatcherPanelRegistryPersistenceRecord>();

  for (const record of [...protectedRecords, ...latestRecords]) {
    recordsById.set(record.recordId, record);
  }

  return normalizeIndex({
    ...normalizedIndex,
    updatedAtIso: getIsoNow(),
    records: [...recordsById.values()],
  });
}

export function createTrackMatcherPanelRegistryPersistenceStorageEnvelope(
  index: TrackMatcherPanelRegistryPersistenceIndex,
): TrackMatcherPanelRegistryPersistenceStorageEnvelope {
  return {
    version: PERSISTENCE_VERSION,
    savedAtIso: getIsoNow(),
    index: normalizeIndex(index),
  };
}

export function serializeTrackMatcherPanelRegistryPersistenceIndex(
  index: TrackMatcherPanelRegistryPersistenceIndex,
) {
  return JSON.stringify(
    createTrackMatcherPanelRegistryPersistenceStorageEnvelope(index),
    null,
    2,
  );
}

export function parseTrackMatcherPanelRegistryPersistenceIndex(
  rawValue: string,
): TrackMatcherPanelRegistryPersistenceIndex | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<TrackMatcherPanelRegistryPersistenceStorageEnvelope>;

    if (parsed.version !== PERSISTENCE_VERSION || !parsed.index) {
      return null;
    }

    return normalizeIndex({
      ...parsed.index,
      records: parsed.index.records ?? [],
    });
  } catch {
    return null;
  }
}

export function writeTrackMatcherPanelRegistryPersistenceIndexToAdapter(
  adapter: TrackMatcherPanelRegistryPersistenceMemoryAdapter,
  key: string,
  index: TrackMatcherPanelRegistryPersistenceIndex,
) {
  adapter.write(key, serializeTrackMatcherPanelRegistryPersistenceIndex(index));
}

export function readTrackMatcherPanelRegistryPersistenceIndexFromAdapter(
  adapter: TrackMatcherPanelRegistryPersistenceMemoryAdapter,
  key: string,
) {
  const rawValue = adapter.read(key);

  if (!rawValue) return null;

  return parseTrackMatcherPanelRegistryPersistenceIndex(rawValue);
}

export function removeTrackMatcherPanelRegistryPersistenceIndexFromAdapter(
  adapter: TrackMatcherPanelRegistryPersistenceMemoryAdapter,
  key: string,
) {
  adapter.remove(key);
}
