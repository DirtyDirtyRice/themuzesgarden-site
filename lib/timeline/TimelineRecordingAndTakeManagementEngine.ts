import type {
  TimelineId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineRecordingStatus =
  | "draft"
  | "recording"
  | "stopped"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineRecordingMode = "normal" | "punch" | "loop";

export type TimelineArmedRecordingTrack = {
  trackId: TimelineTrackId;
  inputId: TimelineId;
  channelCount: number;
  latencyCompensationSamples: number;
  monitoring: "off" | "input" | "auto";
};

export type TimelineRecordedTakeAsset = {
  trackId: TimelineTrackId;
  artifactId: TimelineId;
  checksum: string;
  channelCount: number;
  startSample: number;
  endSample: number;
};

export type TimelineRecordedTake = {
  id: TimelineId;
  pass: number;
  lane: number;
  startTick: number;
  endTick: number;
  startSample: number;
  endSample: number;
  complete: boolean;
  assets: TimelineRecordedTakeAsset[];
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineCompSegment = {
  id: TimelineId;
  takeId: TimelineId;
  trackId: TimelineTrackId;
  startTick: number;
  endTick: number;
};

export type TimelineRecordingIssue = {
  code:
    | "armed-track-required"
    | "range-invalid"
    | "take-incomplete"
    | "take-asset-missing"
    | "take-asset-duplicate"
    | "take-range-invalid"
    | "comp-overlap"
    | "comp-gap";
  message: string;
  subjectId: TimelineId | null;
};

export type TimelineRecordingSession = {
  id: TimelineId;
  projectId: TimelineId;
  songId: TimelineId;
  multiTrackSessionId: TimelineId;
  transportId: TimelineId;
  name: string;
  sampleRate: number;
  status: TimelineRecordingStatus;
  head: number;
  mode: TimelineRecordingMode;
  range: { startTick: number; endTick: number } | null;
  loopPassLimit: number;
  currentPass: number;
  armedTracks: TimelineArmedRecordingTrack[];
  takes: TimelineRecordedTake[];
  compSegments: TimelineCompSegment[];
  issues: TimelineRecordingIssue[];
  recordingStartedAt: string | null;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineRecordingEvent = {
  id: TimelineId;
  sessionId: TimelineId;
  action:
    | "created"
    | "track-armed"
    | "range-configured"
    | "recording-started"
    | "take-committed"
    | "recording-stopped"
    | "comp-segment-added"
    | "validated"
    | "held"
    | "activated"
    | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineRecordingArchive = {
  sessions: TimelineRecordingSession[];
  events: TimelineRecordingEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function text(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

export class TimelineRecordingAndTakeManagementEngine {
  private readonly sessions = new Map<TimelineId, TimelineRecordingSession>();
  private readonly events: TimelineRecordingEvent[] = [];
  private sessionSequence = 0;
  private takeSequence = 0;
  private segmentSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createSession(input: {
    projectId: TimelineId;
    songId: TimelineId;
    multiTrackSessionId: TimelineId;
    transportId: TimelineId;
    name: string;
    sampleRate: number;
    createdBy: TimelineUserId;
  }): TimelineRecordingSession {
    const now = this.now().toISOString();
    const session: TimelineRecordingSession = {
      id: `timeline-recording-session-${++this.sessionSequence}`,
      projectId: text(input.projectId, "Project identity"),
      songId: text(input.songId, "Song identity"),
      multiTrackSessionId: text(input.multiTrackSessionId, "Multi-track session identity"),
      transportId: text(input.transportId, "Transport identity"),
      name: text(input.name, "Recording session name"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      status: "draft",
      head: 0,
      mode: "normal",
      range: null,
      loopPassLimit: 1,
      currentPass: 0,
      armedTracks: [],
      takes: [],
      compSegments: [],
      issues: [],
      recordingStartedAt: null,
      createdAt: now,
      createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.sessions.set(session.id, clone(session));
    this.record(session, "created", session.id, "Recording session created.", input.createdBy);
    return clone(session);
  }

  armTrack(input: {
    sessionId: TimelineId;
    expectedHead: number;
    trackId: TimelineTrackId;
    inputId: TimelineId;
    channelCount: number;
    latencyCompensationSamples?: number;
    monitoring?: TimelineArmedRecordingTrack["monitoring"];
    armedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    if (session.armedTracks.some((track) => track.trackId === input.trackId)) {
      throw new Error("Track is already armed in this recording session.");
    }
    session.armedTracks.push({
      trackId: text(input.trackId, "Track identity"),
      inputId: text(input.inputId, "Recording input identity"),
      channelCount: whole(input.channelCount, 1, 128, "Channel count"),
      latencyCompensationSamples: whole(
        input.latencyCompensationSamples ?? 0,
        -session.sampleRate,
        session.sampleRate,
        "Latency compensation",
      ),
      monitoring: input.monitoring ?? "auto",
    });
    const next = this.save(session, input.armedBy);
    this.record(next, "track-armed", input.trackId, "Track armed for recording.", input.armedBy);
    return next;
  }

  configureRange(input: {
    sessionId: TimelineId;
    expectedHead: number;
    mode: TimelineRecordingMode;
    startTick?: number;
    endTick?: number;
    loopPassLimit?: number;
    editedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    if (input.mode === "normal") {
      session.range = null;
      session.loopPassLimit = 1;
    } else {
      const startTick = whole(input.startTick ?? -1, 0, Number.MAX_SAFE_INTEGER, "Range start");
      const endTick = whole(input.endTick ?? -1, 0, Number.MAX_SAFE_INTEGER, "Range end");
      if (endTick <= startTick) throw new Error("Recording range end must be after its start.");
      session.range = { startTick, endTick };
      session.loopPassLimit =
        input.mode === "loop"
          ? whole(input.loopPassLimit ?? 2, 2, 10_000, "Loop pass limit")
          : 1;
    }
    session.mode = input.mode;
    const next = this.save(session, input.editedBy);
    this.record(next, "range-configured", next.id, `${input.mode} recording configured.`, input.editedBy);
    return next;
  }

  startRecording(input: {
    sessionId: TimelineId;
    expectedHead: number;
    transportTick: number;
    transportPlaying: boolean;
    startedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    if (!session.armedTracks.length) throw new Error("At least one track must be armed.");
    if (!input.transportPlaying) throw new Error("Transport must be playing before recording starts.");
    if (
      session.range &&
      (input.transportTick < session.range.startTick ||
        input.transportTick >= session.range.endTick)
    ) {
      throw new Error("Transport is outside the configured recording range.");
    }
    session.status = "recording";
    session.currentPass += 1;
    session.recordingStartedAt = this.now().toISOString();
    const next = this.save(session, input.startedBy);
    this.record(next, "recording-started", next.id, `Recording pass ${next.currentPass} started.`, input.startedBy);
    return next;
  }

  commitTake(input: {
    sessionId: TimelineId;
    expectedHead: number;
    startTick: number;
    endTick: number;
    startSample: number;
    endSample: number;
    assets: TimelineRecordedTakeAsset[];
    complete?: boolean;
    recordedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.required(input.sessionId);
    this.assertHead(session, input.expectedHead);
    if (session.status !== "recording") throw new Error("Recording is not running.");
    const startTick = whole(input.startTick, 0, Number.MAX_SAFE_INTEGER, "Take start tick");
    const endTick = whole(input.endTick, 0, Number.MAX_SAFE_INTEGER, "Take end tick");
    const startSample = whole(input.startSample, 0, Number.MAX_SAFE_INTEGER, "Take start sample");
    const endSample = whole(input.endSample, 0, Number.MAX_SAFE_INTEGER, "Take end sample");
    if (endTick <= startTick || endSample <= startSample) {
      throw new Error("Take end must be after take start.");
    }
    if (
      session.range &&
      (startTick < session.range.startTick || endTick > session.range.endTick)
    ) {
      throw new Error("Take extends outside the configured recording range.");
    }
    const trackIds = new Set(input.assets.map((asset) => asset.trackId));
    if (trackIds.size !== input.assets.length) {
      throw new Error("A take cannot contain duplicate track assets.");
    }
    const armedIds = new Set(session.armedTracks.map((track) => track.trackId));
    if (input.assets.some((asset) => !armedIds.has(asset.trackId))) {
      throw new Error("Take contains an asset for a track that was not armed.");
    }
    const assets = input.assets.map((asset) => {
      text(asset.artifactId, "Recorded artifact identity");
      text(asset.checksum, "Recorded artifact checksum");
      const armed = session.armedTracks.find((track) => track.trackId === asset.trackId)!;
      if (asset.channelCount !== armed.channelCount) {
        throw new Error("Recorded asset channel count does not match its armed input.");
      }
      if (asset.startSample > startSample || asset.endSample < endSample) {
        throw new Error("Recorded asset does not cover the complete take range.");
      }
      return clone(asset);
    });
    const complete =
      (input.complete ?? true) && assets.length === session.armedTracks.length;
    const take: TimelineRecordedTake = {
      id: `timeline-recorded-take-${++this.takeSequence}`,
      pass: session.currentPass,
      lane: session.takes.length + 1,
      startTick,
      endTick,
      startSample,
      endSample,
      complete,
      assets,
      recordedAt: this.now().toISOString(),
      recordedBy: input.recordedBy,
    };
    session.takes.push(take);
    const shouldContinue =
      session.mode === "loop" && session.currentPass < session.loopPassLimit;
    session.status = shouldContinue ? "draft" : "stopped";
    session.recordingStartedAt = null;
    const next = this.save(session, input.recordedBy);
    this.record(next, "take-committed", take.id, `Take lane ${take.lane} committed immutably.`, input.recordedBy);
    if (!shouldContinue) {
      this.record(next, "recording-stopped", next.id, "Recording stopped after take commit.", input.recordedBy);
    }
    return next;
  }

  stopRecording(input: {
    sessionId: TimelineId;
    expectedHead: number;
    stoppedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.required(input.sessionId);
    this.assertHead(session, input.expectedHead);
    if (session.status !== "recording") throw new Error("Recording is not running.");
    session.status = "stopped";
    session.recordingStartedAt = null;
    const next = this.save(session, input.stoppedBy);
    this.record(next, "recording-stopped", next.id, "Recording stopped without deleting prior takes.", input.stoppedBy);
    return next;
  }

  addCompSegment(input: {
    sessionId: TimelineId;
    expectedHead: number;
    takeId: TimelineId;
    trackId: TimelineTrackId;
    startTick: number;
    endTick: number;
    editedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.editable(input.sessionId, input.expectedHead, ["draft", "stopped", "held"]);
    const take = session.takes.find((item) => item.id === input.takeId);
    if (!take) throw new Error("Comp segment references an unknown take.");
    if (!take.assets.some((asset) => asset.trackId === input.trackId)) {
      throw new Error("Selected take does not contain this track.");
    }
    const startTick = whole(input.startTick, take.startTick, take.endTick, "Comp start");
    const endTick = whole(input.endTick, take.startTick, take.endTick, "Comp end");
    if (endTick <= startTick) throw new Error("Comp segment end must be after its start.");
    if (
      session.compSegments.some(
        (segment) =>
          segment.trackId === input.trackId &&
          startTick < segment.endTick &&
          endTick > segment.startTick,
      )
    ) {
      throw new Error("Comp segments for the same track cannot overlap.");
    }
    const segment: TimelineCompSegment = {
      id: `timeline-comp-segment-${++this.segmentSequence}`,
      takeId: take.id,
      trackId: input.trackId,
      startTick,
      endTick,
    };
    session.compSegments.push(segment);
    const next = this.save(session, input.editedBy);
    this.record(next, "comp-segment-added", segment.id, "Non-destructive comp segment selected.", input.editedBy);
    return next;
  }

  validate(input: {
    sessionId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.editable(input.sessionId, input.expectedHead, ["draft", "stopped", "held"]);
    const issues = this.inspect(session);
    session.issues = issues;
    session.status = issues.length ? "held" : "validated";
    const next = this.save(session, input.validatedBy);
    this.record(
      next,
      issues.length ? "held" : "validated",
      next.id,
      issues.length ? `Recording held with ${issues.length} issue(s).` : "Recording and comp validated.",
      input.validatedBy,
    );
    return next;
  }

  activate(input: {
    sessionId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.required(input.sessionId);
    this.assertHead(session, input.expectedHead);
    if (session.status !== "validated") throw new Error("Only a validated recording can be activated.");
    session.status = "active";
    const next = this.save(session, input.activatedBy);
    this.record(next, "activated", next.id, "Validated comp activated.", input.activatedBy);
    return next;
  }

  archive(input: {
    sessionId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }): TimelineRecordingSession {
    const session = this.required(input.sessionId);
    this.assertHead(session, input.expectedHead);
    if (session.status === "recording") throw new Error("Stop recording before archiving.");
    session.status = "archived";
    const next = this.save(session, input.archivedBy);
    this.record(next, "archived", next.id, "Recording session archived with raw takes preserved.", input.archivedBy);
    return next;
  }

  getSession(id: TimelineId): TimelineRecordingSession | null {
    const session = this.sessions.get(id);
    return session ? clone(session) : null;
  }

  listEvents(sessionId?: TimelineId): TimelineRecordingEvent[] {
    return this.events.filter((event) => !sessionId || event.sessionId === sessionId).map(clone);
  }

  exportArchive(): TimelineRecordingArchive {
    return {
      sessions: Array.from(this.sessions.values()).map(clone),
      events: this.listEvents(),
    };
  }

  restoreArchive(archive: TimelineRecordingArchive): void {
    const ids = new Set<TimelineId>();
    archive.sessions.forEach((session) => {
      if (ids.has(session.id)) throw new Error("Duplicate recording session identity.");
      ids.add(session.id);
    });
    const eventIds = new Set<TimelineId>();
    archive.events.forEach((event) => {
      if (eventIds.has(event.id)) throw new Error("Duplicate recording event identity.");
      if (!ids.has(event.sessionId)) throw new Error("Recording event refers to a missing session.");
      eventIds.add(event.id);
    });
    this.sessions.clear();
    this.events.splice(0);
    this.sessionSequence = 0;
    this.takeSequence = 0;
    this.segmentSequence = 0;
    this.eventSequence = 0;
    archive.sessions.forEach((session) => {
      this.sessions.set(session.id, clone(session));
      this.sessionSequence = Math.max(this.sessionSequence, this.sequence(session.id));
      session.takes.forEach((take) => {
        this.takeSequence = Math.max(this.takeSequence, this.sequence(take.id));
      });
      session.compSegments.forEach((segment) => {
        this.segmentSequence = Math.max(this.segmentSequence, this.sequence(segment.id));
      });
    });
    archive.events.forEach((event) => {
      this.events.push(clone(event));
      this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id));
    });
  }

  private inspect(session: TimelineRecordingSession): TimelineRecordingIssue[] {
    const issues: TimelineRecordingIssue[] = [];
    if (!session.armedTracks.length) {
      issues.push({ code: "armed-track-required", message: "At least one track must be armed.", subjectId: null });
    }
    if (!session.takes.length) {
      issues.push({ code: "take-incomplete", message: "At least one complete take is required.", subjectId: null });
    }
    session.takes.forEach((take) => {
      if (!take.complete) {
        issues.push({ code: "take-incomplete", message: "Take is incomplete.", subjectId: take.id });
      }
      session.armedTracks.forEach((track) => {
        if (!take.assets.some((asset) => asset.trackId === track.trackId)) {
          issues.push({ code: "take-asset-missing", message: `Take is missing ${track.trackId}.`, subjectId: take.id });
        }
      });
    });
    const compTracks = new Set(session.compSegments.map((segment) => segment.trackId));
    session.armedTracks.forEach((track) => {
      if (!compTracks.has(track.trackId)) {
        issues.push({ code: "comp-gap", message: `Comp has no selection for ${track.trackId}.`, subjectId: track.trackId });
      }
    });
    return issues;
  }

  private editable(
    id: TimelineId,
    expectedHead: number,
    allowed: TimelineRecordingStatus[] = ["draft", "stopped", "held"],
  ) {
    const session = this.required(id);
    this.assertHead(session, expectedHead);
    if (!allowed.includes(session.status)) throw new Error(`${session.status} recording sessions cannot be edited.`);
    return session;
  }

  private required(id: TimelineId) {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Recording session ${id} was not found.`);
    return clone(session);
  }

  private assertHead(session: TimelineRecordingSession, expectedHead: number) {
    if (session.head !== expectedHead) {
      throw new Error(`Recording head conflict: expected ${expectedHead}, current ${session.head}.`);
    }
  }

  private save(session: TimelineRecordingSession, updatedBy: TimelineUserId) {
    const next = {
      ...clone(session),
      head: session.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: text(updatedBy, "Editor identity"),
    };
    this.sessions.set(next.id, clone(next));
    return clone(next);
  }

  private record(
    session: TimelineRecordingSession,
    action: TimelineRecordingEvent["action"],
    subjectId: TimelineId,
    message: string,
    recordedBy: TimelineUserId,
  ) {
    this.events.push({
      id: `timeline-recording-event-${++this.eventSequence}`,
      sessionId: session.id,
      action,
      subjectId,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineRecordingAndTakeManagementEngine =
  new TimelineRecordingAndTakeManagementEngine();
