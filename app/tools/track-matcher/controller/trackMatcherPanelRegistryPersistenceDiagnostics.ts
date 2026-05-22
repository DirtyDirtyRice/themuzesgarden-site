import type {
  TrackMatcherPanelRegistryPersistenceDiagnostic,
  TrackMatcherPanelRegistryPersistenceIndex,
  TrackMatcherPanelRegistryPersistenceRecord,
} from "./trackMatcherPanelRegistryPersistenceTypes";
import {
  summarizeTrackMatcherPanelRegistryPersistenceIndex,
} from "./trackMatcherPanelRegistryPersistenceHelpers";

function createDiagnostic(
  level: TrackMatcherPanelRegistryPersistenceDiagnostic["level"],
  title: string,
  message: string,
): TrackMatcherPanelRegistryPersistenceDiagnostic {
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

function getDuplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates].sort((a, b) => a.localeCompare(b));
}

function checksumPayload(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return `checksum-${Math.abs(hash)}`;
}

function getRecordDiagnostics(
  record: TrackMatcherPanelRegistryPersistenceRecord,
): TrackMatcherPanelRegistryPersistenceDiagnostic[] {
  const diagnostics: TrackMatcherPanelRegistryPersistenceDiagnostic[] = [];

  if (!record.recordId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing persistence record id",
        "A registry persistence record is missing its recordId.",
      ),
    );
  }

  if (!record.label.trim()) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Missing persistence record label",
        `Record ${record.recordId || "unknown"} has an empty label.`,
      ),
    );
  }

  if (!record.payload.trim()) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing persistence payload",
        `Record ${record.recordId || "unknown"} has an empty payload.`,
      ),
    );
  }

  if (!record.checksum.trim()) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Missing persistence checksum",
        `Record ${record.recordId || "unknown"} has an empty checksum.`,
      ),
    );
  }

  if (record.checksum && record.payload && record.checksum !== checksumPayload(record.payload)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Persistence checksum mismatch",
        `Record ${record.recordId || "unknown"} payload checksum does not match its stored checksum.`,
      ),
    );
  }

  if (!isValidIsoDate(record.createdAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid persistence created timestamp",
        `Record ${record.recordId || "unknown"} has an invalid createdAtIso value.`,
      ),
    );
  }

  if (!isValidIsoDate(record.updatedAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid persistence updated timestamp",
        `Record ${record.recordId || "unknown"} has an invalid updatedAtIso value.`,
      ),
    );
  }

  if (!Number.isFinite(record.version) || record.version < 1) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Invalid persistence record version",
        `Record ${record.recordId || "unknown"} has an invalid version.`,
      ),
    );
  }

  if (record.entityKind === "unknown" && record.status === "active") {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Unknown active persistence entity",
        `Record ${record.recordId || "unknown"} is active but has unknown entityKind.`,
      ),
    );
  }

  if (record.status === "corrupt" && record.entityKind !== "unknown") {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Corrupt persistence record retained",
        `Record ${record.recordId || "unknown"} is marked corrupt and should not be loaded without repair.`,
      ),
    );
  }

  return diagnostics;
}

export function getTrackMatcherPanelRegistryPersistenceDiagnostics(
  index: TrackMatcherPanelRegistryPersistenceIndex,
): TrackMatcherPanelRegistryPersistenceDiagnostic[] {
  const diagnostics: TrackMatcherPanelRegistryPersistenceDiagnostic[] = [];
  const summary = summarizeTrackMatcherPanelRegistryPersistenceIndex(index);
  const duplicateRecordIds = getDuplicateValues(
    index.records.map((record) => record.recordId),
  );

  if (!index.indexId) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Missing persistence index id",
        "The registry persistence index does not include an indexId.",
      ),
    );
  }

  if (!isValidIsoDate(index.createdAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid persistence index created timestamp",
        "The registry persistence index createdAtIso value is missing or invalid.",
      ),
    );
  }

  if (!isValidIsoDate(index.updatedAtIso)) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Invalid persistence index updated timestamp",
        "The registry persistence index updatedAtIso value is missing or invalid.",
      ),
    );
  }

  if (summary.totalRecords === 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Empty persistence index",
        "The registry persistence index does not contain any records yet.",
      ),
    );
  }

  for (const duplicateId of duplicateRecordIds) {
    diagnostics.push(
      createDiagnostic(
        "error",
        "Duplicate persistence record id",
        `Persistence record ${duplicateId} appears more than once.`,
      ),
    );
  }

  for (const record of index.records) {
    diagnostics.push(...getRecordDiagnostics(record));
  }

  if (summary.corruptRecords > 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Corrupt persistence records present",
        `${summary.corruptRecords} corrupt registry persistence record(s) are present.`,
      ),
    );
  }

  if (summary.unknownRecords > 0) {
    diagnostics.push(
      createDiagnostic(
        "warning",
        "Unknown persistence records present",
        `${summary.unknownRecords} registry persistence record(s) have unknown entityKind.`,
      ),
    );
  }

  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic(
        "ok",
        "Registry persistence healthy",
        `Validated ${summary.totalRecords} persistence record(s).`,
      ),
    );
  }

  return diagnostics;
}

export function hasTrackMatcherPanelRegistryPersistenceErrors(
  index: TrackMatcherPanelRegistryPersistenceIndex,
) {
  return getTrackMatcherPanelRegistryPersistenceDiagnostics(index).some(
    (diagnostic) => diagnostic.level === "error",
  );
}

export function hasTrackMatcherPanelRegistryPersistenceWarnings(
  index: TrackMatcherPanelRegistryPersistenceIndex,
) {
  return getTrackMatcherPanelRegistryPersistenceDiagnostics(index).some(
    (diagnostic) => diagnostic.level === "warning",
  );
}

export function getTrackMatcherPanelRegistryPersistenceHealthLabel(
  index: TrackMatcherPanelRegistryPersistenceIndex,
) {
  const diagnostics = getTrackMatcherPanelRegistryPersistenceDiagnostics(index);

  if (diagnostics.some((diagnostic) => diagnostic.level === "error")) {
    return "Registry persistence has errors";
  }

  if (diagnostics.some((diagnostic) => diagnostic.level === "warning")) {
    return "Registry persistence has warnings";
  }

  return "Registry persistence healthy";
}
