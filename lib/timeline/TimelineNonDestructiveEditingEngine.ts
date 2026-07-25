import {
  TimelineAudioProcessingQueueEngine,
  type TimelineAudioArtifact,
  type TimelineAudioProcessingArchive,
} from "./TimelineAudioProcessingQueueEngine";
import type {
  TimelineId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelineEditClip = {
  id: TimelineId;
  sourceUri: string;
  sourceFingerprint: string;
  timelineStartSeconds: number;
  sourceStartSeconds: number;
  durationSeconds: number;
  gainDb: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  muted: boolean;
};

export type TimelineEditCommand =
  | {
      id: TimelineId;
      kind: "add-clip";
      clip: TimelineEditClip;
      recordedAt: string;
      recordedBy: TimelineUserId;
    }
  | {
      id: TimelineId;
      kind: "update-clip";
      clipId: TimelineId;
      before: TimelineEditClip;
      after: TimelineEditClip;
      recordedAt: string;
      recordedBy: TimelineUserId;
    }
  | {
      id: TimelineId;
      kind: "remove-clip";
      clip: TimelineEditClip;
      recordedAt: string;
      recordedBy: TimelineUserId;
    };

export type TimelineEditSessionStatus =
  | "editing"
  | "rendering"
  | "awaiting-review"
  | "active"
  | "rejected"
  | "stale"
  | "failed";

export type TimelineEditSession = {
  id: TimelineId;
  trackId: TimelineTrackId;
  name: string;
  baseRevisionId: TimelineId | null;
  status: TimelineEditSessionStatus;
  commands: TimelineEditCommand[];
  cursor: number;
  renderRevisionId: TimelineId | null;
  renderJobId: TimelineId | null;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  error?: string;
};

export type TimelineEditSessionView = TimelineEditSession & {
  clips: TimelineEditClip[];
  canUndo: boolean;
  canRedo: boolean;
};

export type TimelineNonDestructiveEditingArchive = {
  audio: TimelineAudioProcessingArchive;
  sessions: TimelineEditSession[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export class TimelineNonDestructiveEditingEngine {
  private readonly sessions = new Map<TimelineId, TimelineEditSession>();
  private sessionSequence = 0;
  private commandSequence = 0;
  private clipSequence = 0;

  constructor(
    readonly audio = new TimelineAudioProcessingQueueEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSession(input: {
    trackId: TimelineTrackId;
    name: string;
    createdBy: TimelineUserId;
  }): TimelineEditSessionView {
    if (!this.audio.revisions.tracks.getTrack(input.trackId)) {
      throw new Error(`Track ${input.trackId} was not found.`);
    }
    const now = this.now().toISOString();
    const session: TimelineEditSession = {
      id: `timeline-edit-session-${++this.sessionSequence}`,
      trackId: input.trackId,
      name: input.name.trim() || "Timeline edit",
      baseRevisionId:
        this.audio.revisions.getActiveRevision(input.trackId)?.id ?? null,
      status: "editing",
      commands: [],
      cursor: 0,
      renderRevisionId: null,
      renderJobId: null,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.sessions.set(session.id, clone(session));
    return this.view(session);
  }

  addClip(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    clip: Omit<TimelineEditClip, "id">;
    editedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    const clip: TimelineEditClip = {
      id: `timeline-edit-clip-${++this.clipSequence}`,
      ...clone(input.clip),
    };
    this.validateClip(clip);
    return this.append(session, {
      id: this.nextCommandId(),
      kind: "add-clip",
      clip,
      recordedAt: this.now().toISOString(),
      recordedBy: input.editedBy,
    });
  }

  updateClip(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    clipId: TimelineId;
    patch: Partial<Omit<TimelineEditClip, "id">>;
    editedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    const before = this.materialize(session).find(
      (clip) => clip.id === input.clipId,
    );
    if (!before) throw new Error(`Clip ${input.clipId} was not found.`);
    const after = { ...clone(before), ...clone(input.patch), id: before.id };
    this.validateClip(after);
    return this.append(session, {
      id: this.nextCommandId(),
      kind: "update-clip",
      clipId: before.id,
      before,
      after,
      recordedAt: this.now().toISOString(),
      recordedBy: input.editedBy,
    });
  }

  removeClip(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    clipId: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    const clip = this.materialize(session).find(
      (candidate) => candidate.id === input.clipId,
    );
    if (!clip) throw new Error(`Clip ${input.clipId} was not found.`);
    return this.append(session, {
      id: this.nextCommandId(),
      kind: "remove-clip",
      clip,
      recordedAt: this.now().toISOString(),
      recordedBy: input.editedBy,
    });
  }

  undo(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    editedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    if (session.cursor === 0) return this.view(session);
    return this.save({
      ...session,
      cursor: session.cursor - 1,
      updatedAt: this.now().toISOString(),
      updatedBy: input.editedBy,
    });
  }

  redo(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    editedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    if (session.cursor === session.commands.length) return this.view(session);
    return this.save({
      ...session,
      cursor: session.cursor + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: input.editedBy,
    });
  }

  queueRender(input: {
    sessionId: TimelineId;
    expectedCursor: number;
    outputFormat?: "wav" | "flac" | "mp3";
    requestedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.editable(input.sessionId, input.expectedCursor);
    const clips = this.materialize(session);
    if (!clips.length) throw new Error("A render requires at least one clip.");
    const draft = this.audio.revisions.createDraft({
      trackId: session.trackId,
      parentRevisionId: session.baseRevisionId ?? undefined,
      branchName: "non-destructive-render",
      label: `${session.name} render`,
      description: `${clips.length} non-destructive timeline clips`,
      source: "processing",
      createdBy: input.requestedBy,
    });
    if (!draft.revision) {
      throw new Error(draft.issues[0]?.message ?? "Render draft failed.");
    }
    clips.forEach((clip) => {
      this.audio.revisions.addOperation({
        revisionId: draft.revision!.id,
        kind: "splice",
        description: `Place ${clip.id} at ${clip.timelineStartSeconds}s`,
        parameters: {
          sourceUri: clip.sourceUri,
          sourceFingerprint: clip.sourceFingerprint,
          timelineStartSeconds: clip.timelineStartSeconds,
          sourceStartSeconds: clip.sourceStartSeconds,
          durationSeconds: clip.durationSeconds,
          gainDb: clip.gainDb,
          fadeInSeconds: clip.fadeInSeconds,
          fadeOutSeconds: clip.fadeOutSeconds,
          muted: clip.muted,
        },
        createdBy: input.requestedBy,
      });
    });
    const uniqueInputs = Array.from(
      new Map(
        clips.map((clip) => [
          `${clip.sourceUri}:${clip.sourceFingerprint}`,
          {
            uri: clip.sourceUri,
            fingerprint: clip.sourceFingerprint,
            role: "source-clip",
          },
        ]),
      ).values(),
    );
    const job = this.audio.createJob({
      revisionId: draft.revision.id,
      kind: "render",
      inputs: uniqueInputs,
      outputSpecification: {
        format: input.outputFormat ?? "wav",
        sampleRate: 48_000,
        bitDepth: 24,
        channels: 2,
      },
      createdBy: input.requestedBy,
    });
    if (!job.job)
      throw new Error(job.issues[0]?.message ?? "Render job failed.");
    this.audio.enqueue({ jobId: job.job.id, queuedBy: input.requestedBy });
    return this.save({
      ...session,
      status: "rendering",
      renderRevisionId: draft.revision.id,
      renderJobId: job.job.id,
      updatedAt: this.now().toISOString(),
      updatedBy: input.requestedBy,
    });
  }

  claimNextRender(input: {
    workerId: string;
    leaseMilliseconds: number;
  }): TimelineEditSessionView | null {
    const job = this.audio.claimNext(input);
    if (!job) return null;
    const session = Array.from(this.sessions.values()).find(
      (candidate) => candidate.renderJobId === job.id,
    );
    if (!session) throw new Error(`No edit session owns render job ${job.id}.`);
    return this.view(session);
  }

  completeRender(input: {
    sessionId: TimelineId;
    workerId: string;
    output: TimelineAudioArtifact;
  }): TimelineEditSessionView {
    const session = this.required(input.sessionId);
    if (session.status !== "rendering" || !session.renderJobId) {
      throw new Error("Only a rendering session can complete.");
    }
    const result = this.audio.complete({
      jobId: session.renderJobId,
      workerId: input.workerId,
      output: input.output,
    });
    if (!result.accepted) {
      return this.save({
        ...session,
        status: "failed",
        error: result.issues[0]?.message ?? "Render failed.",
        updatedAt: this.now().toISOString(),
        updatedBy: input.workerId,
      });
    }
    return this.save({
      ...session,
      status: "awaiting-review",
      updatedAt: this.now().toISOString(),
      updatedBy: input.workerId,
    });
  }

  reviewRender(input: {
    sessionId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
  }): TimelineEditSessionView {
    const session = this.required(input.sessionId);
    if (session.status !== "awaiting-review" || !session.renderRevisionId) {
      throw new Error(
        "Only a completed render awaiting review can be decided.",
      );
    }
    const now = this.now().toISOString();
    if (input.decision === "reject") {
      this.audio.revisions.moveToTrash({
        revisionId: session.renderRevisionId,
        deletedBy: input.reviewedBy,
      });
      return this.save({
        ...session,
        status: "rejected",
        reviewedAt: now,
        reviewedBy: input.reviewedBy,
        updatedAt: now,
        updatedBy: input.reviewedBy,
      });
    }
    const active =
      this.audio.revisions.getActiveRevision(session.trackId)?.id ?? null;
    if (active !== session.baseRevisionId) {
      return this.save({
        ...session,
        status: "stale",
        reviewedAt: now,
        reviewedBy: input.reviewedBy,
        updatedAt: now,
        updatedBy: input.reviewedBy,
      });
    }
    const validation = this.audio.revisions.validate({
      revisionId: session.renderRevisionId,
      validatedBy: input.reviewedBy,
    });
    if (!validation.accepted) {
      return this.save({
        ...session,
        status: "failed",
        error: validation.issues.map((issue) => issue.message).join(" "),
        reviewedAt: now,
        reviewedBy: input.reviewedBy,
        updatedAt: now,
        updatedBy: input.reviewedBy,
      });
    }
    const activation = this.audio.revisions.activate({
      revisionId: session.renderRevisionId,
      activatedBy: input.reviewedBy,
    });
    return this.save({
      ...session,
      status: activation.accepted ? "active" : "failed",
      error: activation.accepted
        ? undefined
        : activation.issues.map((issue) => issue.message).join(" "),
      reviewedAt: now,
      reviewedBy: input.reviewedBy,
      updatedAt: now,
      updatedBy: input.reviewedBy,
    });
  }

  getSession(sessionId: TimelineId): TimelineEditSessionView | null {
    const session = this.sessions.get(sessionId);
    return session ? this.view(session) : null;
  }

  listSessions(trackId?: TimelineTrackId): TimelineEditSessionView[] {
    return Array.from(this.sessions.values())
      .filter((session) => !trackId || session.trackId === trackId)
      .map((session) => this.view(session));
  }

  exportArchive(): TimelineNonDestructiveEditingArchive {
    return {
      audio: this.audio.exportArchive(),
      sessions: Array.from(this.sessions.values()).map(clone),
    };
  }

  restoreArchive(archive: TimelineNonDestructiveEditingArchive): void {
    const ids = new Set<TimelineId>();
    const commandIds = new Set<TimelineId>();
    archive.sessions.forEach((session) => {
      if (ids.has(session.id))
        throw new Error(`Duplicate edit session ID ${session.id}.`);
      if (session.cursor < 0 || session.cursor > session.commands.length) {
        throw new Error(`Edit session ${session.id} has an invalid cursor.`);
      }
      session.commands.forEach((command) => {
        if (commandIds.has(command.id))
          throw new Error(`Duplicate edit command ID ${command.id}.`);
        commandIds.add(command.id);
      });
      ids.add(session.id);
    });
    this.audio.restoreArchive(archive.audio);
    this.sessions.clear();
    archive.sessions.forEach((session) =>
      this.sessions.set(session.id, clone(session)),
    );
    this.sessionSequence = this.maxSequence(ids);
    this.commandSequence = this.maxSequence(commandIds);
    this.clipSequence = Math.max(
      0,
      ...archive.sessions
        .flatMap((session) =>
          session.commands.flatMap((command) =>
            command.kind === "update-clip"
              ? [command.before.id, command.after.id]
              : [command.clip.id],
          ),
        )
        .map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0)),
    );
  }

  private append(
    session: TimelineEditSession,
    command: TimelineEditCommand,
  ): TimelineEditSessionView {
    const commands = [
      ...session.commands.slice(0, session.cursor),
      clone(command),
    ];
    return this.save({
      ...session,
      commands,
      cursor: commands.length,
      updatedAt: this.now().toISOString(),
      updatedBy: command.recordedBy,
    });
  }

  private materialize(session: TimelineEditSession): TimelineEditClip[] {
    const clips = new Map<TimelineId, TimelineEditClip>();
    session.commands.slice(0, session.cursor).forEach((command) => {
      if (command.kind === "add-clip") {
        clips.set(command.clip.id, clone(command.clip));
      } else if (command.kind === "update-clip") {
        clips.set(command.clipId, clone(command.after));
      } else {
        clips.delete(command.clip.id);
      }
    });
    return Array.from(clips.values()).sort(
      (left, right) =>
        left.timelineStartSeconds - right.timelineStartSeconds ||
        left.id.localeCompare(right.id),
    );
  }

  private view(session: TimelineEditSession): TimelineEditSessionView {
    return {
      ...clone(session),
      clips: this.materialize(session),
      canUndo: session.status === "editing" && session.cursor > 0,
      canRedo:
        session.status === "editing" &&
        session.cursor < session.commands.length,
    };
  }

  private validateClip(clip: TimelineEditClip): void {
    if (!clip.sourceUri.trim() || !clip.sourceFingerprint.trim()) {
      throw new Error("Every clip requires a source URI and fingerprint.");
    }
    for (const [label, value] of [
      ["timeline start", clip.timelineStartSeconds],
      ["source start", clip.sourceStartSeconds],
      ["duration", clip.durationSeconds],
      ["fade in", clip.fadeInSeconds],
      ["fade out", clip.fadeOutSeconds],
    ] as const) {
      if (!finiteNonNegative(value)) throw new Error(`${label} is invalid.`);
    }
    if (clip.durationSeconds === 0)
      throw new Error("Clip duration must be greater than zero.");
    if (clip.fadeInSeconds + clip.fadeOutSeconds > clip.durationSeconds) {
      throw new Error("Combined fades cannot exceed clip duration.");
    }
    if (
      !Number.isFinite(clip.gainDb) ||
      clip.gainDb < -120 ||
      clip.gainDb > 24
    ) {
      throw new Error("Clip gain must be between -120 dB and +24 dB.");
    }
  }

  private editable(
    sessionId: TimelineId,
    expectedCursor: number,
  ): TimelineEditSession {
    const session = this.required(sessionId);
    if (session.status !== "editing")
      throw new Error(`Edit session ${sessionId} is ${session.status}.`);
    if (session.cursor !== expectedCursor) {
      throw new Error(
        `Stale edit cursor ${expectedCursor}; current cursor is ${session.cursor}.`,
      );
    }
    return session;
  }

  private required(sessionId: TimelineId): TimelineEditSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Edit session ${sessionId} was not found.`);
    return clone(session);
  }

  private save(session: TimelineEditSession): TimelineEditSessionView {
    this.sessions.set(session.id, clone(session));
    return this.view(session);
  }

  private nextCommandId(): TimelineId {
    return `timeline-edit-command-${++this.commandSequence}`;
  }

  private maxSequence(ids: Set<TimelineId>): number {
    return Math.max(
      0,
      ...Array.from(ids).map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0)),
    );
  }
}

export const timelineNonDestructiveEditingEngine =
  new TimelineNonDestructiveEditingEngine();
