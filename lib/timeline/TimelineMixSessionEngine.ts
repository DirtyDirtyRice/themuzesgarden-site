import { createHash } from "node:crypto";

import { TimelineAudioProcessingQueueEngine } from "./TimelineAudioProcessingQueueEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineMixSessionStatus =
  | "editing"
  | "rendering"
  | "awaiting-review"
  | "active"
  | "stale"
  | "rejected"
  | "failed";

export type TimelineMixLane = {
  id: TimelineId;
  trackId: TimelineId;
  revisionId: TimelineId;
  name: string;
  order: number;
  busId: TimelineId;
  gainDb: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
};

export type TimelineMixBus = {
  id: TimelineId;
  name: string;
  kind: "master" | "group" | "aux";
  outputBusId: TimelineId | null;
  gainDb: number;
  muted: boolean;
};

export type TimelineMixSnapshot = {
  id: TimelineId;
  sessionId: TimelineId;
  head: number;
  checksum: string;
  lanes: TimelineMixLane[];
  buses: TimelineMixBus[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineMixSession = {
  id: TimelineId;
  songId: TimelineId;
  masterTrackId: TimelineId;
  name: string;
  status: TimelineMixSessionStatus;
  head: number;
  lanes: TimelineMixLane[];
  buses: TimelineMixBus[];
  snapshotIds: TimelineId[];
  renderSnapshotId: TimelineId | null;
  renderRevisionId: TimelineId | null;
  renderJobId: TimelineId | null;
  error?: string;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineMixSessionArchive = {
  sessions: TimelineMixSession[];
  snapshots: TimelineMixSnapshot[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class TimelineMixSessionEngine {
  private readonly sessions = new Map<TimelineId, TimelineMixSession>();
  private readonly snapshots = new Map<TimelineId, TimelineMixSnapshot>();
  private sessionSequence = 0;
  private laneSequence = 0;
  private busSequence = 0;
  private snapshotSequence = 0;

  constructor(
    readonly audio = new TimelineAudioProcessingQueueEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSession(input: {
    songId: TimelineId;
    masterTrackId: TimelineId;
    name: string;
    createdBy: TimelineUserId;
  }): TimelineMixSession {
    const masterTrack = this.audio.revisions.tracks.getTrack(
      input.masterTrackId,
    );
    if (!masterTrack) throw new Error("Master track was not found.");
    if (masterTrack.songId !== input.songId) {
      throw new Error("Master track belongs to a different song.");
    }
    const now = this.now().toISOString();
    const masterBus: TimelineMixBus = {
      id: `timeline-mix-bus-${++this.busSequence}`,
      name: "Master",
      kind: "master",
      outputBusId: null,
      gainDb: 0,
      muted: false,
    };
    const session: TimelineMixSession = {
      id: `timeline-mix-session-${++this.sessionSequence}`,
      songId: input.songId,
      masterTrackId: input.masterTrackId,
      name: input.name.trim() || "Song mix",
      status: "editing",
      head: 0,
      lanes: [],
      buses: [masterBus],
      snapshotIds: [],
      renderSnapshotId: null,
      renderRevisionId: null,
      renderJobId: null,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.sessions.set(session.id, clone(session));
    return clone(session);
  }

  addBus(input: {
    sessionId: TimelineId;
    expectedHead: number;
    name: string;
    kind: "group" | "aux";
    outputBusId?: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const outputBusId = input.outputBusId ?? this.masterBus(session).id;
    this.requiredBus(session, outputBusId);
    const bus: TimelineMixBus = {
      id: `timeline-mix-bus-${++this.busSequence}`,
      name: input.name.trim() || (input.kind === "group" ? "Group" : "Aux"),
      kind: input.kind,
      outputBusId,
      gainDb: 0,
      muted: false,
    };
    return this.saveEdit(
      session,
      { buses: [...session.buses, bus] },
      input.editedBy,
    );
  }

  updateBus(input: {
    sessionId: TimelineId;
    expectedHead: number;
    busId: TimelineId;
    patch: Partial<
      Pick<TimelineMixBus, "name" | "outputBusId" | "gainDb" | "muted">
    >;
    editedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const current = this.requiredBus(session, input.busId);
    const next = { ...current, ...clone(input.patch), id: current.id };
    if (current.kind === "master" && next.outputBusId !== null) {
      throw new Error("The master bus cannot route to another bus.");
    }
    if (next.outputBusId) {
      this.requiredBus(session, next.outputBusId);
      if (next.outputBusId === next.id)
        throw new Error("A bus cannot route to itself.");
    }
    this.validateGain(next.gainDb);
    const buses = session.buses.map((bus) => (bus.id === next.id ? next : bus));
    this.assertAcyclicBuses(buses);
    return this.saveEdit(session, { buses }, input.editedBy);
  }

  addLane(input: {
    sessionId: TimelineId;
    expectedHead: number;
    trackId: TimelineId;
    revisionId?: TimelineId;
    name?: string;
    busId?: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const track = this.audio.revisions.tracks.getTrack(input.trackId);
    if (!track) throw new Error("Mix lane track was not found.");
    if (track.songId !== session.songId) {
      throw new Error("Mix lane track belongs to a different song.");
    }
    const revision =
      (input.revisionId
        ? this.audio.revisions.getRevision(input.revisionId)
        : this.audio.revisions.getActiveRevision(input.trackId)) ?? null;
    if (!revision || revision.trackId !== track.id) {
      throw new Error("Mix lane requires a revision from its track.");
    }
    if (session.lanes.some((lane) => lane.trackId === track.id)) {
      throw new Error("The track already has a lane in this mix.");
    }
    const busId = input.busId ?? this.masterBus(session).id;
    this.requiredBus(session, busId);
    const lane: TimelineMixLane = {
      id: `timeline-mix-lane-${++this.laneSequence}`,
      trackId: track.id,
      revisionId: revision.id,
      name: input.name?.trim() || track.title,
      order: session.lanes.length,
      busId,
      gainDb: 0,
      pan: 0,
      muted: false,
      soloed: false,
    };
    return this.saveEdit(
      session,
      { lanes: [...session.lanes, lane] },
      input.editedBy,
    );
  }

  updateLane(input: {
    sessionId: TimelineId;
    expectedHead: number;
    laneId: TimelineId;
    patch: Partial<
      Pick<
        TimelineMixLane,
        | "name"
        | "revisionId"
        | "order"
        | "busId"
        | "gainDb"
        | "pan"
        | "muted"
        | "soloed"
      >
    >;
    editedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const current = session.lanes.find((lane) => lane.id === input.laneId);
    if (!current) throw new Error("Mix lane was not found.");
    const next = { ...current, ...clone(input.patch), id: current.id };
    this.validateGain(next.gainDb);
    if (next.pan < -1 || next.pan > 1)
      throw new Error("Pan must be between -1 and 1.");
    this.requiredBus(session, next.busId);
    const revision = this.audio.revisions.getRevision(next.revisionId);
    if (!revision || revision.trackId !== current.trackId) {
      throw new Error("Lane revision must belong to the lane track.");
    }
    const lanes = session.lanes
      .map((lane) => (lane.id === next.id ? next : lane))
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
      .map((lane, order) => ({ ...lane, order }));
    return this.saveEdit(session, { lanes }, input.editedBy);
  }

  removeLane(input: {
    sessionId: TimelineId;
    expectedHead: number;
    laneId: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    if (!session.lanes.some((lane) => lane.id === input.laneId)) {
      throw new Error("Mix lane was not found.");
    }
    const lanes = session.lanes
      .filter((lane) => lane.id !== input.laneId)
      .map((lane, order) => ({ ...lane, order }));
    return this.saveEdit(session, { lanes }, input.editedBy);
  }

  createSnapshot(input: {
    sessionId: TimelineId;
    expectedHead: number;
    createdBy: TimelineUserId;
  }): TimelineMixSnapshot {
    const session = this.editable(input.sessionId, input.expectedHead);
    this.validateReady(session);
    const snapshot: TimelineMixSnapshot = {
      id: `timeline-mix-snapshot-${++this.snapshotSequence}`,
      sessionId: session.id,
      head: session.head,
      checksum: checksum({ lanes: session.lanes, buses: session.buses }),
      lanes: clone(session.lanes),
      buses: clone(session.buses),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.snapshots.set(snapshot.id, clone(snapshot));
    this.sessions.set(session.id, {
      ...session,
      snapshotIds: [...session.snapshotIds, snapshot.id],
    });
    return clone(snapshot);
  }

  queueMixdown(input: {
    sessionId: TimelineId;
    expectedHead: number;
    requestedBy: TimelineUserId;
    outputFormat?: "wav" | "flac" | "mp3";
  }): TimelineMixSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const snapshot = this.createSnapshot({
      sessionId: session.id,
      expectedHead: session.head,
      createdBy: input.requestedBy,
    });
    const draft = this.audio.revisions.createDraft({
      trackId: session.masterTrackId,
      label: `${session.name} mixdown`,
      description: `Mix snapshot ${snapshot.id}`,
      source: "processing",
      createdBy: input.requestedBy,
    }).revision;
    if (!draft) throw new Error("Mixdown revision could not be created.");
    this.audio.revisions.addOperation({
      revisionId: draft.id,
      kind: "effect",
      description: `Render ${snapshot.lanes.length} lanes through ${snapshot.buses.length} buses`,
      parameters: {
        snapshotId: snapshot.id,
        snapshotChecksum: snapshot.checksum,
      },
      createdBy: input.requestedBy,
    });
    const inputs = snapshot.lanes.map((lane) => {
      const revision = this.audio.revisions.getRevision(lane.revisionId)!;
      return {
        uri: revision.outputArtifactUri!,
        fingerprint: revision.outputFingerprint!,
        role: `mix-lane:${lane.id}`,
      };
    });
    const job = this.audio.createJob({
      revisionId: draft.id,
      kind: "mixdown",
      inputs,
      outputSpecification: {
        format: input.outputFormat ?? "wav",
        sampleRate: 48_000,
        bitDepth: 24,
        channels: 2,
      },
      createdBy: input.requestedBy,
    }).job;
    if (!job) throw new Error("Mixdown job could not be created.");
    this.audio.enqueue({ jobId: job.id, queuedBy: input.requestedBy });
    return this.save({
      ...this.required(session.id),
      status: "rendering",
      renderSnapshotId: snapshot.id,
      renderRevisionId: draft.id,
      renderJobId: job.id,
      updatedAt: this.now().toISOString(),
      updatedBy: input.requestedBy,
    });
  }

  claimNextMixdown(input: {
    workerId: string;
    leaseMilliseconds: number;
  }): TimelineMixSession | null {
    const job = this.audio.claimNext(input);
    if (!job) return null;
    const session = [...this.sessions.values()].find(
      (item) => item.renderJobId === job.id,
    );
    if (!session) throw new Error("Claimed mixdown has no owning session.");
    return clone(session);
  }

  completeMixdown(input: {
    sessionId: TimelineId;
    workerId: string;
    outputUri: string;
    outputFingerprint: string;
  }): TimelineMixSession {
    const session = this.required(input.sessionId);
    if (session.status !== "rendering" || !session.renderJobId) {
      throw new Error("Only a rendering mix can complete.");
    }
    const result = this.audio.complete({
      jobId: session.renderJobId,
      workerId: input.workerId,
      output: {
        uri: input.outputUri,
        fingerprint: input.outputFingerprint,
        role: "mixdown-output",
      },
    });
    return this.save({
      ...session,
      status: result.accepted ? "awaiting-review" : "failed",
      error: result.accepted ? undefined : result.issues[0]?.message,
      updatedAt: this.now().toISOString(),
      updatedBy: input.workerId,
    });
  }

  reviewMixdown(input: {
    sessionId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
  }): TimelineMixSession {
    const session = this.required(input.sessionId);
    if (
      session.status !== "awaiting-review" ||
      !session.renderRevisionId ||
      !session.renderSnapshotId
    ) {
      throw new Error("Only a completed mixdown can be reviewed.");
    }
    const snapshot = this.snapshots.get(session.renderSnapshotId)!;
    if (
      snapshot.head !== session.head ||
      snapshot.checksum !==
        checksum({ lanes: session.lanes, buses: session.buses })
    ) {
      return this.save({ ...session, status: "stale" });
    }
    if (input.decision === "reject") {
      this.audio.revisions.moveToTrash({
        revisionId: session.renderRevisionId,
        deletedBy: input.reviewedBy,
      });
      return this.reviewed(session, "rejected", input.reviewedBy);
    }
    const validated = this.audio.revisions.validate({
      revisionId: session.renderRevisionId,
      validatedBy: input.reviewedBy,
    });
    if (!validated.accepted) throw new Error(validated.issues[0]?.message);
    const activated = this.audio.revisions.activate({
      revisionId: session.renderRevisionId,
      activatedBy: input.reviewedBy,
    });
    if (!activated.accepted) throw new Error(activated.issues[0]?.message);
    return this.reviewed(session, "active", input.reviewedBy);
  }

  getSession(sessionId: TimelineId): TimelineMixSession | null {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : null;
  }

  listSnapshots(sessionId: TimelineId): TimelineMixSnapshot[] {
    return [...this.snapshots.values()]
      .filter((snapshot) => snapshot.sessionId === sessionId)
      .map(clone);
  }

  exportArchive(): TimelineMixSessionArchive {
    return {
      sessions: [...this.sessions.values()].map(clone),
      snapshots: [...this.snapshots.values()].map(clone),
    };
  }

  restoreArchive(archive: TimelineMixSessionArchive): void {
    const unique = <T extends { id: TimelineId }>(
      values: T[],
      label: string,
    ) => {
      if (new Set(values.map((value) => value.id)).size !== values.length) {
        throw new Error(`Archive contains duplicate ${label} IDs.`);
      }
    };
    unique(archive.sessions, "session");
    unique(archive.snapshots, "snapshot");
    this.sessions.clear();
    this.snapshots.clear();
    archive.sessions.forEach((session) =>
      this.sessions.set(session.id, clone(session)),
    );
    archive.snapshots.forEach((snapshot) =>
      this.snapshots.set(snapshot.id, clone(snapshot)),
    );
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.sessionSequence = Math.max(
      0,
      ...archive.sessions.map((value) => sequence(value.id)),
    );
    this.laneSequence = Math.max(
      0,
      ...archive.sessions
        .flatMap((value) => value.lanes)
        .map((value) => sequence(value.id)),
    );
    this.busSequence = Math.max(
      0,
      ...archive.sessions
        .flatMap((value) => value.buses)
        .map((value) => sequence(value.id)),
    );
    this.snapshotSequence = Math.max(
      0,
      ...archive.snapshots.map((value) => sequence(value.id)),
    );
  }

  private editable(
    sessionId: TimelineId,
    expectedHead: number,
  ): TimelineMixSession {
    const session = this.required(sessionId);
    if (session.status !== "editing")
      throw new Error("Mix session is not editable.");
    if (session.head !== expectedHead) {
      throw new Error(
        `Stale mix head ${expectedHead}; current head is ${session.head}.`,
      );
    }
    return session;
  }

  private validateReady(session: TimelineMixSession): void {
    if (!session.lanes.length)
      throw new Error("A mix requires at least one lane.");
    session.lanes.forEach((lane) => {
      const revision = this.audio.revisions.getRevision(lane.revisionId);
      if (
        !revision ||
        !["active", "superseded"].includes(revision.state) ||
        !revision.outputArtifactUri ||
        !revision.outputFingerprint
      ) {
        throw new Error(`Lane ${lane.id} requires rendered revision output.`);
      }
    });
    this.assertAcyclicBuses(session.buses);
  }

  private assertAcyclicBuses(buses: TimelineMixBus[]): void {
    const byId = new Map(buses.map((bus) => [bus.id, bus]));
    for (const bus of buses) {
      const visited = new Set<TimelineId>();
      let cursor: TimelineMixBus | undefined = bus;
      while (cursor?.outputBusId) {
        if (visited.has(cursor.id))
          throw new Error("Mix bus routing contains a cycle.");
        visited.add(cursor.id);
        cursor = byId.get(cursor.outputBusId);
      }
    }
  }

  private validateGain(gainDb: number): void {
    if (!Number.isFinite(gainDb) || gainDb < -120 || gainDb > 24) {
      throw new Error("Gain must be between -120 dB and +24 dB.");
    }
  }

  private masterBus(session: TimelineMixSession): TimelineMixBus {
    return session.buses.find((bus) => bus.kind === "master")!;
  }

  private requiredBus(
    session: TimelineMixSession,
    busId: TimelineId,
  ): TimelineMixBus {
    const bus = session.buses.find((candidate) => candidate.id === busId);
    if (!bus) throw new Error("Mix bus was not found.");
    return bus;
  }

  private required(sessionId: TimelineId): TimelineMixSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Mix session was not found.");
    return clone(session);
  }

  private saveEdit(
    session: TimelineMixSession,
    patch: Partial<Pick<TimelineMixSession, "lanes" | "buses">>,
    editedBy: TimelineUserId,
  ): TimelineMixSession {
    return this.save({
      ...session,
      ...clone(patch),
      head: session.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: editedBy,
    });
  }

  private reviewed(
    session: TimelineMixSession,
    status: "active" | "rejected",
    reviewedBy: TimelineUserId,
  ): TimelineMixSession {
    const now = this.now().toISOString();
    return this.save({
      ...session,
      status,
      reviewedAt: now,
      reviewedBy,
      updatedAt: now,
      updatedBy: reviewedBy,
    });
  }

  private save(session: TimelineMixSession): TimelineMixSession {
    this.sessions.set(session.id, clone(session));
    return clone(session);
  }
}

export const timelineMixSessionEngine = new TimelineMixSessionEngine();
