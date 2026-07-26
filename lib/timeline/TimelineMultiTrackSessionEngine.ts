import type {
  TimelineId,
  TimelineProjectId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";
import {
  TimelineSongTrackRepositoryEngine,
  type TimelineSongTrackQuery,
  type TimelineSongTrackRecord,
} from "./TimelineSongTrackRepositoryEngine";

export type TimelineMultiTrackSessionStatus =
  | "draft"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineMultiTrackPrivacy = "private" | "public";

export type TimelineSessionTrackRole =
  | "audio"
  | "midi"
  | "instrument"
  | "vocal"
  | "automation"
  | "prompt"
  | "reference"
  | "folder"
  | "bus"
  | "return"
  | "master";

export type TimelineSessionTrackBinding = {
  trackId: TimelineTrackId;
  role: TimelineSessionTrackRole;
  visible: boolean;
  recordArmed: boolean;
  inputMonitoring: boolean;
  frozen: boolean;
  addedAt: string;
  addedBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineMultiTrackSessionIssue = {
  code:
    | "track-missing"
    | "track-scope-mismatch"
    | "track-duplicate"
    | "track-archived"
    | "master-required"
    | "master-duplicate"
    | "role-kind-mismatch"
    | "record-arm-invalid"
    | "public-permissions-invalid";
  message: string;
  trackId: TimelineTrackId | null;
};

export type TimelineMultiTrackSession = {
  id: TimelineId;
  projectId: TimelineProjectId;
  songId: TimelineId;
  name: string;
  privacy: TimelineMultiTrackPrivacy;
  permittedUserIds: TimelineUserId[];
  status: TimelineMultiTrackSessionStatus;
  head: number;
  trackBindings: TimelineSessionTrackBinding[];
  issues: TimelineMultiTrackSessionIssue[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineSessionTrackView = {
  track: TimelineSongTrackRecord;
  binding: TimelineSessionTrackBinding;
};

export type TimelineSessionTrackPage = {
  tracks: TimelineSessionTrackView[];
  total: number;
  cursor: string | null;
  nextCursor: string | null;
  hasMore: boolean;
};

export type TimelineMultiTrackSessionEvent = {
  id: TimelineId;
  sessionId: TimelineId;
  action:
    | "created"
    | "track-attached"
    | "track-updated"
    | "validated"
    | "held"
    | "activated"
    | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineMultiTrackSessionArchive = {
  sessions: TimelineMultiTrackSession[];
  events: TimelineMultiTrackSessionEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function uniqueUsers(userIds: TimelineUserId[] = []): TimelineUserId[] {
  return Array.from(
    new Set(userIds.map((userId) => userId.trim()).filter(Boolean)),
  ).sort();
}

const compatibleKinds: Record<
  TimelineSessionTrackRole,
  TimelineSongTrackRecord["kind"][]
> = {
  audio: ["audio"],
  midi: ["midi"],
  instrument: ["midi", "audio"],
  vocal: ["audio"],
  automation: ["automation"],
  prompt: ["prompt"],
  reference: ["reference", "audio"],
  folder: ["folder"],
  bus: ["bus"],
  return: ["bus"],
  master: ["bus"],
};

export class TimelineMultiTrackSessionEngine {
  private readonly sessions = new Map<TimelineId, TimelineMultiTrackSession>();
  private readonly events: TimelineMultiTrackSessionEvent[] = [];
  private sessionSequence = 0;
  private eventSequence = 0;

  constructor(
    private readonly repository: TimelineSongTrackRepositoryEngine,
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSession(input: {
    projectId: TimelineProjectId;
    songId: TimelineId;
    name: string;
    privacy: TimelineMultiTrackPrivacy;
    permittedUserIds?: TimelineUserId[];
    createdBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const now = this.now().toISOString();
    const permittedUserIds = uniqueUsers(input.permittedUserIds);
    if (input.privacy === "public" && permittedUserIds.length > 0) {
      throw new Error("Public sessions cannot have private permission entries.");
    }
    const session: TimelineMultiTrackSession = {
      id: `timeline-multi-track-session-${++this.sessionSequence}`,
      projectId: requiredText(input.projectId, "Project identity"),
      songId: requiredText(input.songId, "Song identity"),
      name: requiredText(input.name, "Session name"),
      privacy: input.privacy,
      permittedUserIds,
      status: "draft",
      head: 0,
      trackBindings: [],
      issues: [],
      createdAt: now,
      createdBy: requiredText(input.createdBy, "Creator identity"),
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.sessions.set(session.id, clone(session));
    this.record(
      session.id,
      "created",
      session.id,
      "Multi-track session created as a draft.",
      input.createdBy,
    );
    return clone(session);
  }

  attachTrack(input: {
    sessionId: TimelineId;
    expectedHead: number;
    trackId: TimelineTrackId;
    role: TimelineSessionTrackRole;
    visible?: boolean;
    recordArmed?: boolean;
    inputMonitoring?: boolean;
    frozen?: boolean;
    editedBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const track = this.repository.getTrack(input.trackId);
    if (!track) throw new Error(`Track ${input.trackId} was not found.`);
    if (
      track.projectId !== session.projectId ||
      track.songId !== session.songId
    ) {
      throw new Error("Track and session must belong to the same song and project.");
    }
    if (track.state !== "active") {
      throw new Error("Only active repository tracks can enter a session.");
    }
    if (
      session.trackBindings.some((binding) => binding.trackId === track.id)
    ) {
      throw new Error("This track is already attached to the session.");
    }
    this.assertRole(track, input.role);
    if (
      input.role === "master" &&
      session.trackBindings.some((binding) => binding.role === "master")
    ) {
      throw new Error("A multi-track session can contain only one master track.");
    }
    if (
      (input.recordArmed || input.inputMonitoring) &&
      !["audio", "midi", "instrument", "vocal"].includes(input.role)
    ) {
      throw new Error("Only performance tracks can be armed or input-monitored.");
    }
    const now = this.now().toISOString();
    session.trackBindings.push({
      trackId: track.id,
      role: input.role,
      visible: input.visible ?? true,
      recordArmed: input.recordArmed ?? false,
      inputMonitoring: input.inputMonitoring ?? false,
      frozen: input.frozen ?? false,
      addedAt: now,
      addedBy: input.editedBy,
      updatedAt: now,
      updatedBy: input.editedBy,
    });
    const next = this.save(session, input.editedBy);
    this.record(
      session.id,
      "track-attached",
      track.id,
      `${input.role} track attached to the session.`,
      input.editedBy,
    );
    return next;
  }

  updateTrack(input: {
    sessionId: TimelineId;
    expectedHead: number;
    trackId: TimelineTrackId;
    patch: Partial<
      Pick<
        TimelineSessionTrackBinding,
        | "role"
        | "visible"
        | "recordArmed"
        | "inputMonitoring"
        | "frozen"
      >
    >;
    editedBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const index = session.trackBindings.findIndex(
      (binding) => binding.trackId === input.trackId,
    );
    if (index < 0) throw new Error("Track is not attached to this session.");
    const track = this.repository.getTrack(input.trackId);
    if (!track) throw new Error(`Track ${input.trackId} was not found.`);
    const current = session.trackBindings[index];
    const role = input.patch.role ?? current.role;
    this.assertRole(track, role);
    if (
      role === "master" &&
      session.trackBindings.some(
        (binding, bindingIndex) =>
          bindingIndex !== index && binding.role === "master",
      )
    ) {
      throw new Error("A multi-track session can contain only one master track.");
    }
    const recordArmed = input.patch.recordArmed ?? current.recordArmed;
    const inputMonitoring =
      input.patch.inputMonitoring ?? current.inputMonitoring;
    if (
      (recordArmed || inputMonitoring) &&
      !["audio", "midi", "instrument", "vocal"].includes(role)
    ) {
      throw new Error("Only performance tracks can be armed or input-monitored.");
    }
    const now = this.now().toISOString();
    session.trackBindings[index] = {
      ...current,
      ...clone(input.patch),
      role,
      recordArmed,
      inputMonitoring,
      updatedAt: now,
      updatedBy: input.editedBy,
    };
    const next = this.save(session, input.editedBy);
    this.record(
      session.id,
      "track-updated",
      input.trackId,
      "Session track state updated.",
      input.editedBy,
    );
    return next;
  }

  validate(input: {
    sessionId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const session = this.editable(input.sessionId, input.expectedHead);
    const issues = this.inspect(session);
    session.issues = issues;
    session.status = issues.length === 0 ? "validated" : "held";
    const next = this.save(session, input.validatedBy);
    this.record(
      session.id,
      issues.length === 0 ? "validated" : "held",
      session.id,
      issues.length === 0
        ? "Multi-track session passed validation."
        : `Multi-track session held with ${issues.length} issue(s).`,
      input.validatedBy,
    );
    return next;
  }

  activate(input: {
    sessionId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const session = this.requireSession(input.sessionId);
    this.assertHead(session, input.expectedHead);
    if (session.status !== "validated") {
      throw new Error("Only a validated multi-track session can be activated.");
    }
    session.status = "active";
    const next = this.save(session, input.activatedBy);
    this.record(
      session.id,
      "activated",
      session.id,
      "Multi-track session activated.",
      input.activatedBy,
    );
    return next;
  }

  archive(input: {
    sessionId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }): TimelineMultiTrackSession {
    const session = this.requireSession(input.sessionId);
    this.assertHead(session, input.expectedHead);
    session.status = "archived";
    const next = this.save(session, input.archivedBy);
    this.record(
      session.id,
      "archived",
      session.id,
      "Multi-track session archived without changing stable track identities.",
      input.archivedBy,
    );
    return next;
  }

  queryTracks(
    sessionId: TimelineId,
    query: Omit<TimelineSongTrackQuery, "songId"> = {},
  ): TimelineSessionTrackPage {
    const session = this.requireSession(sessionId);
    const limit = query.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new Error("Session track query limit must be between 1 and 500.");
    }
    const offset = this.decodeCursor(query.cursor);
    const states = new Set(query.states ?? ["active"]);
    const kinds = query.kinds ? new Set(query.kinds) : null;
    const tags = Array.from(
      new Set(
        (query.tags ?? [])
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    const search = query.search?.trim().toLowerCase() ?? "";
    const parentWasSpecified = Object.prototype.hasOwnProperty.call(
      query,
      "parentTrackId",
    );
    const matches = session.trackBindings
      .map((binding) => {
        const track = this.repository.getTrack(binding.trackId);
        return track ? { track, binding } : null;
      })
      .filter(
        (view): view is TimelineSessionTrackView =>
          Boolean(view) &&
          states.has(view!.track.state) &&
          (!kinds || kinds.has(view!.track.kind)) &&
          (!parentWasSpecified ||
            view!.track.parentTrackId === (query.parentTrackId ?? null)) &&
          (!search ||
            view!.track.title.toLowerCase().includes(search) ||
            view!.track.tags.some((tag) => tag.includes(search))) &&
          (tags.length === 0 ||
            tags.every((tag) => view!.track.tags.includes(tag))),
      )
      .sort(
        (first, second) =>
          first.track.order - second.track.order ||
          first.track.id.localeCompare(second.track.id),
      );
    const tracks = matches.slice(offset, offset + limit).map(clone);
    const nextOffset = offset + tracks.length;
    const hasMore = nextOffset < matches.length;
    return {
      tracks,
      total: matches.length,
      cursor: query.cursor ?? null,
      nextCursor: hasMore ? `session-track-offset-${nextOffset}` : null,
      hasMore,
    };
  }

  statistics(sessionId: TimelineId): {
    total: number;
    visible: number;
    armed: number;
    frozen: number;
    byRole: Record<TimelineSessionTrackRole, number>;
  } {
    const bindings = this.requireSession(sessionId).trackBindings;
    const byRole = Object.fromEntries(
      [
        "audio",
        "midi",
        "instrument",
        "vocal",
        "automation",
        "prompt",
        "reference",
        "folder",
        "bus",
        "return",
        "master",
      ].map((role) => [role, 0]),
    ) as Record<TimelineSessionTrackRole, number>;
    bindings.forEach((binding) => {
      byRole[binding.role] += 1;
    });
    return {
      total: bindings.length,
      visible: bindings.filter((binding) => binding.visible).length,
      armed: bindings.filter((binding) => binding.recordArmed).length,
      frozen: bindings.filter((binding) => binding.frozen).length,
      byRole,
    };
  }

  getSession(sessionId: TimelineId): TimelineMultiTrackSession | null {
    const session = this.sessions.get(sessionId);
    return session ? clone(session) : null;
  }

  listSessions(): TimelineMultiTrackSession[] {
    return Array.from(this.sessions.values()).map(clone);
  }

  listEvents(sessionId?: TimelineId): TimelineMultiTrackSessionEvent[] {
    return this.events
      .filter((event) => !sessionId || event.sessionId === sessionId)
      .map(clone);
  }

  exportArchive(): TimelineMultiTrackSessionArchive {
    return {
      sessions: this.listSessions(),
      events: this.listEvents(),
    };
  }

  restoreArchive(archive: TimelineMultiTrackSessionArchive): void {
    const sessionIds = new Set<TimelineId>();
    archive.sessions.forEach((session) => {
      if (sessionIds.has(session.id)) {
        throw new Error(`Duplicate session ${session.id} in archive.`);
      }
      sessionIds.add(session.id);
    });
    const eventIds = new Set<TimelineId>();
    archive.events.forEach((event) => {
      if (eventIds.has(event.id)) {
        throw new Error(`Duplicate event ${event.id} in archive.`);
      }
      if (!sessionIds.has(event.sessionId)) {
        throw new Error(`Event ${event.id} refers to a missing session.`);
      }
      eventIds.add(event.id);
    });
    this.sessions.clear();
    this.events.splice(0);
    this.sessionSequence = 0;
    this.eventSequence = 0;
    archive.sessions.forEach((session) => {
      this.sessions.set(session.id, clone(session));
      this.sessionSequence = Math.max(
        this.sessionSequence,
        this.idSequence(session.id),
      );
    });
    archive.events.forEach((event) => {
      this.events.push(clone(event));
      this.eventSequence = Math.max(
        this.eventSequence,
        this.idSequence(event.id),
      );
    });
  }

  private inspect(
    session: TimelineMultiTrackSession,
  ): TimelineMultiTrackSessionIssue[] {
    const issues: TimelineMultiTrackSessionIssue[] = [];
    const masters = session.trackBindings.filter(
      (binding) => binding.role === "master",
    );
    if (masters.length === 0) {
      issues.push({
        code: "master-required",
        message: "The session requires one master track.",
        trackId: null,
      });
    }
    if (masters.length > 1) {
      issues.push({
        code: "master-duplicate",
        message: "The session has more than one master track.",
        trackId: null,
      });
    }
    if (session.privacy === "public" && session.permittedUserIds.length > 0) {
      issues.push({
        code: "public-permissions-invalid",
        message: "A public session cannot contain private permission entries.",
        trackId: null,
      });
    }
    session.trackBindings.forEach((binding) => {
      const track = this.repository.getTrack(binding.trackId);
      if (!track) {
        issues.push({
          code: "track-missing",
          message: `Track ${binding.trackId} no longer exists.`,
          trackId: binding.trackId,
        });
        return;
      }
      if (
        track.projectId !== session.projectId ||
        track.songId !== session.songId
      ) {
        issues.push({
          code: "track-scope-mismatch",
          message: "Track belongs to another song or project.",
          trackId: track.id,
        });
      }
      if (track.state !== "active") {
        issues.push({
          code: "track-archived",
          message: "Archived or trashed tracks cannot enter an active session.",
          trackId: track.id,
        });
      }
      if (!compatibleKinds[binding.role].includes(track.kind)) {
        issues.push({
          code: "role-kind-mismatch",
          message: `${binding.role} is incompatible with a ${track.kind} repository track.`,
          trackId: track.id,
        });
      }
      if (
        (binding.recordArmed || binding.inputMonitoring) &&
        !["audio", "midi", "instrument", "vocal"].includes(binding.role)
      ) {
        issues.push({
          code: "record-arm-invalid",
          message: "Only performance tracks can be armed or input-monitored.",
          trackId: track.id,
        });
      }
    });
    return issues;
  }

  private assertRole(
    track: TimelineSongTrackRecord,
    role: TimelineSessionTrackRole,
  ): void {
    if (!compatibleKinds[role]?.includes(track.kind)) {
      throw new Error(
        `${role} role is incompatible with a ${track.kind} repository track.`,
      );
    }
  }

  private editable(
    sessionId: TimelineId,
    expectedHead: number,
  ): TimelineMultiTrackSession {
    const session = this.requireSession(sessionId);
    this.assertHead(session, expectedHead);
    if (["active", "archived"].includes(session.status)) {
      throw new Error(`${session.status} sessions cannot be edited.`);
    }
    return session;
  }

  private requireSession(sessionId: TimelineId): TimelineMultiTrackSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} was not found.`);
    return clone(session);
  }

  private assertHead(
    session: TimelineMultiTrackSession,
    expectedHead: number,
  ): void {
    if (session.head !== expectedHead) {
      throw new Error(
        `Session head conflict: expected ${expectedHead}, current ${session.head}.`,
      );
    }
  }

  private save(
    session: TimelineMultiTrackSession,
    updatedBy: TimelineUserId,
  ): TimelineMultiTrackSession {
    const next = {
      ...clone(session),
      head: session.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: requiredText(updatedBy, "Editor identity"),
    };
    this.sessions.set(next.id, clone(next));
    return clone(next);
  }

  private record(
    sessionId: TimelineId,
    action: TimelineMultiTrackSessionEvent["action"],
    subjectId: TimelineId,
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.events.push({
      id: `timeline-multi-track-session-event-${++this.eventSequence}`,
      sessionId,
      action,
      subjectId,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }

  private decodeCursor(cursor?: string): number {
    if (!cursor) return 0;
    const match = /^session-track-offset-(\d+)$/.exec(cursor);
    if (!match) throw new Error("Session track query cursor is invalid.");
    return Number(match[1]);
  }
}

export const timelineMultiTrackSessionEngine =
  new TimelineMultiTrackSessionEngine(
    new TimelineSongTrackRepositoryEngine(),
  );
