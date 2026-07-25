import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineSyncLocationKind = "local" | "cloud" | "peer" | "archive";
export type TimelineSyncDirection = "push" | "pull" | "bidirectional";
export type TimelineSyncStatus =
  | "draft"
  | "verified"
  | "current"
  | "diverged"
  | "held"
  | "restored"
  | "archived";

export type TimelineProjectSnapshotEntry = {
  id: TimelineId;
  stableId: TimelineId;
  path: string;
  kind: "project" | "audio" | "midi" | "lyrics" | "metadata" | "settings";
  fingerprint: string;
  sizeBytes: number;
  modifiedAt: string;
};

export type TimelineProjectSnapshot = {
  id: TimelineId;
  projectId: TimelineId;
  locationId: TimelineId;
  parentSnapshotId: TimelineId | null;
  entries: TimelineProjectSnapshotEntry[];
  fingerprint: string;
  status: TimelineSyncStatus;
  createdAt: string;
  createdBy: TimelineUserId;
  verifiedAt?: string;
  verifiedBy?: TimelineUserId;
};

export type TimelineSyncLocation = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  kind: TimelineSyncLocationKind;
  writable: boolean;
  currentSnapshotId: TimelineId | null;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSyncConflict = {
  id: TimelineId;
  stableId: TimelineId;
  path: string;
  localEntry: TimelineProjectSnapshotEntry | null;
  remoteEntry: TimelineProjectSnapshotEntry | null;
  baseEntry: TimelineProjectSnapshotEntry | null;
  resolution: "unresolved" | "local" | "remote" | "keep-both" | "deleted";
  resolvedAt?: string;
  resolvedBy?: TimelineUserId;
};

export type TimelineSyncSession = {
  id: TimelineId;
  projectId: TimelineId;
  sourceLocationId: TimelineId;
  destinationLocationId: TimelineId;
  baseSnapshotId: TimelineId | null;
  sourceSnapshotId: TimelineId;
  destinationSnapshotId: TimelineId | null;
  direction: TimelineSyncDirection;
  status: "planned" | "held" | "resolved" | "applied" | "cancelled";
  conflicts: TimelineSyncConflict[];
  resultSnapshotId?: TimelineId;
  createdAt: string;
  createdBy: TimelineUserId;
  appliedAt?: string;
  appliedBy?: TimelineUserId;
};

export type TimelineSyncLedgerEntry = {
  id: TimelineId;
  projectId: TimelineId;
  subjectId: TimelineId;
  action:
    | "location-registered"
    | "snapshot-created"
    | "snapshot-verified"
    | "sync-planned"
    | "conflict-resolved"
    | "sync-applied"
    | "restore-verified"
    | "archived";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineProjectSyncArchive = {
  locations: TimelineSyncLocation[];
  snapshots: TimelineProjectSnapshot[];
  sessions: TimelineSyncSession[];
  ledger: TimelineSyncLedgerEntry[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function hash(value: unknown): string {
  let result = 2166136261;
  for (const character of JSON.stringify(value)) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return `sync-${(result >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineProjectSyncEngine {
  private readonly locations = new Map<TimelineId, TimelineSyncLocation>();
  private readonly snapshots = new Map<TimelineId, TimelineProjectSnapshot>();
  private readonly sessions = new Map<TimelineId, TimelineSyncSession>();
  private readonly ledger: TimelineSyncLedgerEntry[] = [];
  private locationSequence = 0;
  private snapshotSequence = 0;
  private entrySequence = 0;
  private sessionSequence = 0;
  private conflictSequence = 0;
  private ledgerSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerLocation(input: {
    projectId: TimelineId;
    name: string;
    kind: TimelineSyncLocationKind;
    writable: boolean;
    createdBy: TimelineUserId;
  }): TimelineSyncLocation {
    const projectId = requiredText(input.projectId, "Project ID");
    const name = requiredText(input.name, "Sync location name");
    if (
      this.listLocations(projectId).some(
        (location) => location.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      throw new Error(`Sync location "${name}" already exists for this project.`);
    }
    const value: TimelineSyncLocation = {
      id: `timeline-sync-location-${++this.locationSequence}`,
      projectId,
      name,
      kind: input.kind,
      writable: input.writable,
      currentSnapshotId: null,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.locations.set(value.id, clone(value));
    this.record(
      value.projectId,
      value.id,
      "location-registered",
      `${value.kind} location "${value.name}" registered.`,
      input.createdBy,
    );
    return clone(value);
  }

  createSnapshot(input: {
    locationId: TimelineId;
    parentSnapshotId?: TimelineId | null;
    entries: Array<Omit<TimelineProjectSnapshotEntry, "id">>;
    createdBy: TimelineUserId;
  }): TimelineProjectSnapshot {
    const location = this.requireLocation(input.locationId);
    const current = location.currentSnapshotId
      ? this.requireSnapshot(location.currentSnapshotId)
      : null;
    const parentSnapshotId =
      input.parentSnapshotId === undefined ? current?.id ?? null : input.parentSnapshotId;
    if (parentSnapshotId) {
      const parent = this.requireSnapshot(parentSnapshotId);
      if (parent.projectId !== location.projectId) {
        throw new Error("Parent snapshot belongs to another project.");
      }
    }
    const entries = input.entries.map((entry) => this.normalizeEntry(entry));
    this.validateEntries(entries);
    const value: TimelineProjectSnapshot = {
      id: `timeline-sync-snapshot-${++this.snapshotSequence}`,
      projectId: location.projectId,
      locationId: location.id,
      parentSnapshotId,
      entries,
      fingerprint: "",
      status: "draft",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    value.fingerprint = this.snapshotFingerprint(value);
    this.snapshots.set(value.id, clone(value));
    this.record(
      value.projectId,
      value.id,
      "snapshot-created",
      `Immutable snapshot created with ${entries.length} entries.`,
      input.createdBy,
    );
    return clone(value);
  }

  verifySnapshot(input: {
    snapshotId: TimelineId;
    observedFingerprints: Record<TimelineId, string>;
    verifiedBy: TimelineUserId;
  }): TimelineProjectSnapshot {
    const value = this.requireSnapshot(input.snapshotId);
    if (value.status !== "draft") throw new Error("Only a draft snapshot can be verified.");
    for (const entry of value.entries) {
      const observed = input.observedFingerprints[entry.stableId];
      if (!observed) throw new Error(`Snapshot entry "${entry.path}" was not observed.`);
      if (observed !== entry.fingerprint) {
        throw new Error(`Snapshot entry "${entry.path}" failed fingerprint verification.`);
      }
    }
    if (value.fingerprint !== this.snapshotFingerprint(value)) {
      throw new Error("Snapshot manifest fingerprint is invalid.");
    }
    const verified: TimelineProjectSnapshot = {
      ...value,
      status: "verified",
      verifiedAt: this.now().toISOString(),
      verifiedBy: input.verifiedBy,
    };
    this.snapshots.set(verified.id, clone(verified));
    this.record(
      verified.projectId,
      verified.id,
      "snapshot-verified",
      "Every entry and the snapshot manifest passed verification.",
      input.verifiedBy,
    );
    return clone(verified);
  }

  promoteSnapshot(input: {
    snapshotId: TimelineId;
    promotedBy: TimelineUserId;
  }): TimelineProjectSnapshot {
    const value = this.requireSnapshot(input.snapshotId);
    if (value.status !== "verified") throw new Error("Only a verified snapshot can become current.");
    const location = this.requireLocation(value.locationId);
    if (!location.writable) throw new Error("A read-only location cannot receive a current snapshot.");
    if (location.currentSnapshotId) {
      const previous = this.requireSnapshot(location.currentSnapshotId);
      this.snapshots.set(previous.id, { ...previous, status: "archived" });
      this.record(
        previous.projectId,
        previous.id,
        "archived",
        "Superseded by a newer verified snapshot.",
        input.promotedBy,
      );
    }
    const current: TimelineProjectSnapshot = { ...value, status: "current" };
    this.snapshots.set(current.id, clone(current));
    this.locations.set(location.id, { ...location, currentSnapshotId: current.id });
    return clone(current);
  }

  planSync(input: {
    sourceLocationId: TimelineId;
    destinationLocationId: TimelineId;
    baseSnapshotId?: TimelineId | null;
    direction: TimelineSyncDirection;
    createdBy: TimelineUserId;
  }): TimelineSyncSession {
    const source = this.requireLocation(input.sourceLocationId);
    const destination = this.requireLocation(input.destinationLocationId);
    if (source.id === destination.id) throw new Error("Sync locations must be different.");
    if (source.projectId !== destination.projectId) {
      throw new Error("Cross-project synchronization is not allowed.");
    }
    if (!destination.writable) throw new Error("Destination location is read-only.");
    if (!source.currentSnapshotId) throw new Error("Source has no current snapshot.");
    const sourceSnapshot = this.requireSnapshot(source.currentSnapshotId);
    const destinationSnapshot = destination.currentSnapshotId
      ? this.requireSnapshot(destination.currentSnapshotId)
      : null;
    const baseSnapshotId =
      input.baseSnapshotId === undefined
        ? this.findCommonAncestor(sourceSnapshot, destinationSnapshot)
        : input.baseSnapshotId;
    const baseSnapshot = baseSnapshotId ? this.requireSnapshot(baseSnapshotId) : null;
    if (baseSnapshot && baseSnapshot.projectId !== source.projectId) {
      throw new Error("Sync base belongs to another project.");
    }
    const conflicts = this.findConflicts(sourceSnapshot, destinationSnapshot, baseSnapshot);
    const value: TimelineSyncSession = {
      id: `timeline-sync-session-${++this.sessionSequence}`,
      projectId: source.projectId,
      sourceLocationId: source.id,
      destinationLocationId: destination.id,
      baseSnapshotId: baseSnapshot?.id ?? null,
      sourceSnapshotId: sourceSnapshot.id,
      destinationSnapshotId: destinationSnapshot?.id ?? null,
      direction: input.direction,
      status: conflicts.length ? "held" : "planned",
      conflicts,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.sessions.set(value.id, clone(value));
    this.record(
      value.projectId,
      value.id,
      "sync-planned",
      conflicts.length
        ? `Sync held with ${conflicts.length} explicit conflict(s).`
        : "Sync plan is conflict-free and ready to apply.",
      input.createdBy,
    );
    return clone(value);
  }

  resolveConflict(input: {
    sessionId: TimelineId;
    conflictId: TimelineId;
    resolution: Exclude<TimelineSyncConflict["resolution"], "unresolved">;
    resolvedBy: TimelineUserId;
  }): TimelineSyncSession {
    const value = this.requireSession(input.sessionId);
    if (value.status !== "held") throw new Error("This sync session is not held.");
    const conflict = value.conflicts.find((candidate) => candidate.id === input.conflictId);
    if (!conflict) throw new Error(`Unknown sync conflict: ${input.conflictId}`);
    conflict.resolution = input.resolution;
    conflict.resolvedAt = this.now().toISOString();
    conflict.resolvedBy = input.resolvedBy;
    value.status = value.conflicts.every((candidate) => candidate.resolution !== "unresolved")
      ? "resolved"
      : "held";
    this.sessions.set(value.id, clone(value));
    this.record(
      value.projectId,
      conflict.id,
      "conflict-resolved",
      `Conflict for "${conflict.path}" resolved as ${input.resolution}.`,
      input.resolvedBy,
    );
    return clone(value);
  }

  applySync(input: {
    sessionId: TimelineId;
    appliedBy: TimelineUserId;
  }): TimelineSyncSession {
    const session = this.requireSession(input.sessionId);
    if (!["planned", "resolved"].includes(session.status)) {
      throw new Error("Sync cannot apply while conflicts are unresolved.");
    }
    const source = this.requireSnapshot(session.sourceSnapshotId);
    const destination = session.destinationSnapshotId
      ? this.requireSnapshot(session.destinationSnapshotId)
      : null;
    const destinationLocation = this.requireLocation(session.destinationLocationId);
    if (destinationLocation.currentSnapshotId !== session.destinationSnapshotId) {
      throw new Error("Destination changed after planning; create a new sync plan.");
    }
    if (
      this.requireLocation(session.sourceLocationId).currentSnapshotId !==
      session.sourceSnapshotId
    ) {
      throw new Error("Source changed after planning; create a new sync plan.");
    }
    const entries = this.mergeEntries(source, destination, session.conflicts);
    const result = this.createSnapshot({
      locationId: destinationLocation.id,
      parentSnapshotId: destination?.id ?? null,
      entries: entries.map(({ id: _id, ...entry }) => entry),
      createdBy: input.appliedBy,
    });
    const verified = this.verifySnapshot({
      snapshotId: result.id,
      observedFingerprints: Object.fromEntries(
        result.entries.map((entry) => [entry.stableId, entry.fingerprint]),
      ),
      verifiedBy: input.appliedBy,
    });
    this.promoteSnapshot({ snapshotId: verified.id, promotedBy: input.appliedBy });
    const applied: TimelineSyncSession = {
      ...session,
      status: "applied",
      resultSnapshotId: verified.id,
      appliedAt: this.now().toISOString(),
      appliedBy: input.appliedBy,
    };
    this.sessions.set(applied.id, clone(applied));
    this.record(
      applied.projectId,
      applied.id,
      "sync-applied",
      `Sync applied as verified snapshot ${verified.id}.`,
      input.appliedBy,
    );
    return clone(applied);
  }

  verifyRestore(input: {
    snapshotId: TimelineId;
    restoredEntries: Array<Omit<TimelineProjectSnapshotEntry, "id">>;
    verifiedBy: TimelineUserId;
  }): boolean {
    const snapshot = this.requireSnapshot(input.snapshotId);
    if (!["verified", "current", "archived", "restored"].includes(snapshot.status)) {
      throw new Error("Snapshot must be verified before a restore rehearsal.");
    }
    const restored = input.restoredEntries.map((entry) => ({
      ...entry,
      id: "restore-entry",
      path: this.normalizePath(entry.path),
    }));
    this.validateEntries(restored);
    const expected = this.entrySignature(snapshot.entries);
    const actual = this.entrySignature(restored);
    if (expected !== actual) throw new Error("Restored content does not match the snapshot.");
    this.record(
      snapshot.projectId,
      snapshot.id,
      "restore-verified",
      "Restore rehearsal reproduced every stable identity and fingerprint.",
      input.verifiedBy,
    );
    return true;
  }

  getSnapshot(id: TimelineId): TimelineProjectSnapshot | null {
    const value = this.snapshots.get(id);
    return value ? clone(value) : null;
  }

  getSession(id: TimelineId): TimelineSyncSession | null {
    const value = this.sessions.get(id);
    return value ? clone(value) : null;
  }

  listLocations(projectId?: TimelineId): TimelineSyncLocation[] {
    return [...this.locations.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  listLedger(projectId?: TimelineId): TimelineSyncLedgerEntry[] {
    return this.ledger.filter((value) => !projectId || value.projectId === projectId).map(clone);
  }

  exportArchive(): TimelineProjectSyncArchive {
    return {
      locations: [...this.locations.values()].map(clone),
      snapshots: [...this.snapshots.values()].map(clone),
      sessions: [...this.sessions.values()].map(clone),
      ledger: this.ledger.map(clone),
    };
  }

  restoreArchive(archive: TimelineProjectSyncArchive): void {
    const allIds = new Set<TimelineId>();
    this.locations.clear();
    this.snapshots.clear();
    this.sessions.clear();
    this.ledger.length = 0;
    for (const location of archive.locations) {
      if (allIds.has(location.id)) throw new Error("Duplicate sync archive identity.");
      allIds.add(location.id);
      this.locations.set(location.id, clone(location));
    }
    for (const snapshot of archive.snapshots) {
      if (allIds.has(snapshot.id)) throw new Error("Duplicate sync archive identity.");
      allIds.add(snapshot.id);
      if (!this.locations.has(snapshot.locationId)) {
        throw new Error(`Snapshot ${snapshot.id} references an unknown location.`);
      }
      if (snapshot.fingerprint !== this.snapshotFingerprint(snapshot)) {
        throw new Error(`Snapshot ${snapshot.id} fingerprint is invalid.`);
      }
      this.validateEntries(snapshot.entries);
      this.snapshots.set(snapshot.id, clone(snapshot));
    }
    for (const location of archive.locations) {
      if (location.currentSnapshotId && !this.snapshots.has(location.currentSnapshotId)) {
        throw new Error(`Location ${location.id} references an unknown current snapshot.`);
      }
    }
    for (const session of archive.sessions) {
      if (allIds.has(session.id)) throw new Error("Duplicate sync archive identity.");
      allIds.add(session.id);
      this.sessions.set(session.id, clone(session));
    }
    this.ledger.push(...archive.ledger.map(clone));
    this.locationSequence = this.highest(archive.locations.map((value) => value.id));
    this.snapshotSequence = this.highest(archive.snapshots.map((value) => value.id));
    this.entrySequence = this.highest(
      archive.snapshots.flatMap((snapshot) => snapshot.entries.map((entry) => entry.id)),
    );
    this.sessionSequence = this.highest(archive.sessions.map((value) => value.id));
    this.conflictSequence = this.highest(
      archive.sessions.flatMap((session) => session.conflicts.map((conflict) => conflict.id)),
    );
    this.ledgerSequence = this.highest(archive.ledger.map((value) => value.id));
  }

  private normalizeEntry(
    entry: Omit<TimelineProjectSnapshotEntry, "id">,
  ): TimelineProjectSnapshotEntry {
    if (!Number.isInteger(entry.sizeBytes) || entry.sizeBytes < 0) {
      throw new Error("Snapshot entry size must be a non-negative whole number.");
    }
    if (Number.isNaN(Date.parse(entry.modifiedAt))) {
      throw new Error("Snapshot entry modified time is invalid.");
    }
    return {
      ...clone(entry),
      id: `timeline-sync-entry-${++this.entrySequence}`,
      stableId: requiredText(entry.stableId, "Stable entry ID"),
      path: this.normalizePath(entry.path),
      fingerprint: requiredText(entry.fingerprint, "Entry fingerprint"),
    };
  }

  private validateEntries(entries: TimelineProjectSnapshotEntry[]): void {
    const stableIds = new Set<TimelineId>();
    const paths = new Set<string>();
    for (const entry of entries) {
      const path = this.normalizePath(entry.path).toLowerCase();
      if (stableIds.has(entry.stableId)) throw new Error(`Duplicate stable ID "${entry.stableId}".`);
      if (paths.has(path)) throw new Error(`Duplicate snapshot path "${entry.path}".`);
      stableIds.add(entry.stableId);
      paths.add(path);
    }
  }

  private findConflicts(
    source: TimelineProjectSnapshot,
    destination: TimelineProjectSnapshot | null,
    base: TimelineProjectSnapshot | null,
  ): TimelineSyncConflict[] {
    if (!destination || source.fingerprint === destination.fingerprint) return [];
    const sourceById = new Map(source.entries.map((entry) => [entry.stableId, entry]));
    const destinationById = new Map(destination.entries.map((entry) => [entry.stableId, entry]));
    const baseById = new Map((base?.entries ?? []).map((entry) => [entry.stableId, entry]));
    const stableIds = new Set([...sourceById.keys(), ...destinationById.keys(), ...baseById.keys()]);
    const conflicts: TimelineSyncConflict[] = [];
    for (const stableId of stableIds) {
      const localEntry = sourceById.get(stableId) ?? null;
      const remoteEntry = destinationById.get(stableId) ?? null;
      const baseEntry = baseById.get(stableId) ?? null;
      const localChanged = this.entryValue(localEntry) !== this.entryValue(baseEntry);
      const remoteChanged = this.entryValue(remoteEntry) !== this.entryValue(baseEntry);
      if (
        localChanged &&
        remoteChanged &&
        this.entryValue(localEntry) !== this.entryValue(remoteEntry)
      ) {
        conflicts.push({
          id: `timeline-sync-conflict-${++this.conflictSequence}`,
          stableId,
          path: localEntry?.path ?? remoteEntry?.path ?? baseEntry?.path ?? stableId,
          localEntry: clone(localEntry),
          remoteEntry: clone(remoteEntry),
          baseEntry: clone(baseEntry),
          resolution: "unresolved",
        });
      }
    }
    return conflicts;
  }

  private mergeEntries(
    source: TimelineProjectSnapshot,
    destination: TimelineProjectSnapshot | null,
    conflicts: TimelineSyncConflict[],
  ): TimelineProjectSnapshotEntry[] {
    const merged = new Map(
      (destination?.entries ?? []).map((entry) => [entry.stableId, clone(entry)]),
    );
    for (const entry of source.entries) merged.set(entry.stableId, clone(entry));
    for (const conflict of conflicts) {
      if (conflict.resolution === "remote" && conflict.remoteEntry) {
        merged.set(conflict.stableId, clone(conflict.remoteEntry));
      } else if (conflict.resolution === "deleted") {
        merged.delete(conflict.stableId);
      } else if (conflict.resolution === "keep-both") {
        if (conflict.localEntry) merged.set(conflict.stableId, clone(conflict.localEntry));
        if (conflict.remoteEntry) {
          const copy = clone(conflict.remoteEntry);
          copy.stableId = `${copy.stableId}-remote-copy`;
          copy.path = this.copyPath(copy.path);
          merged.set(copy.stableId, copy);
        }
      }
    }
    return [...merged.values()];
  }

  private findCommonAncestor(
    source: TimelineProjectSnapshot,
    destination: TimelineProjectSnapshot | null,
  ): TimelineId | null {
    if (!destination) return null;
    const sourceAncestors = new Set<TimelineId>();
    let cursor: TimelineProjectSnapshot | null = source;
    while (cursor) {
      sourceAncestors.add(cursor.id);
      cursor = cursor.parentSnapshotId ? this.requireSnapshot(cursor.parentSnapshotId) : null;
    }
    cursor = destination;
    while (cursor) {
      if (sourceAncestors.has(cursor.id)) return cursor.id;
      cursor = cursor.parentSnapshotId ? this.requireSnapshot(cursor.parentSnapshotId) : null;
    }
    return null;
  }

  private snapshotFingerprint(value: TimelineProjectSnapshot): string {
    return hash({
      projectId: value.projectId,
      locationId: value.locationId,
      parentSnapshotId: value.parentSnapshotId,
      entries: value.entries,
      createdAt: value.createdAt,
      createdBy: value.createdBy,
    });
  }

  private entryValue(entry: TimelineProjectSnapshotEntry | null): string {
    return entry
      ? `${entry.stableId}|${entry.path}|${entry.kind}|${entry.fingerprint}|${entry.sizeBytes}`
      : "<deleted>";
  }

  private entrySignature(entries: TimelineProjectSnapshotEntry[]): string {
    return hash(
      entries
        .map((entry) => this.entryValue(entry))
        .sort((left, right) => left.localeCompare(right)),
    );
  }

  private normalizePath(path: string): string {
    const normalized = requiredText(path, "Snapshot path").replace(/\\/g, "/");
    if (
      normalized.startsWith("/") ||
      /^[A-Za-z]:\//.test(normalized) ||
      normalized.split("/").some((part) => part === "" || part === "..")
    ) {
      throw new Error("Snapshot path must be safe, relative, and cannot traverse directories.");
    }
    return normalized;
  }

  private copyPath(path: string): string {
    const dot = path.lastIndexOf(".");
    return dot < 0
      ? `${path}-remote-copy`
      : `${path.slice(0, dot)}-remote-copy${path.slice(dot)}`;
  }

  private requireLocation(id: TimelineId): TimelineSyncLocation {
    const value = this.locations.get(id);
    if (!value) throw new Error(`Unknown sync location: ${id}`);
    return clone(value);
  }

  private requireSnapshot(id: TimelineId): TimelineProjectSnapshot {
    const value = this.snapshots.get(id);
    if (!value) throw new Error(`Unknown project snapshot: ${id}`);
    return clone(value);
  }

  private requireSession(id: TimelineId): TimelineSyncSession {
    const value = this.sessions.get(id);
    if (!value) throw new Error(`Unknown sync session: ${id}`);
    return clone(value);
  }

  private record(
    projectId: TimelineId,
    subjectId: TimelineId,
    action: TimelineSyncLedgerEntry["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.ledger.push({
      id: `timeline-sync-ledger-${++this.ledgerSequence}`,
      projectId,
      subjectId,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) => Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
