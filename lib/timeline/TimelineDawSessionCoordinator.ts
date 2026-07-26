import type { TimelineId, TimelineProjectId, TimelineUserId } from "./TimelineTypes";
import {
  TIMELINE_DAW_ENGINE_IDS,
  TimelineDawSystemIntegrationEngine,
  type TimelineDawIntegrationReport,
} from "./TimelineDawSystemIntegrationEngine";

export type TimelineDawSessionState = "draft" | "ready" | "active" | "suspended" | "closed";
export type TimelineDawSession = {
  id: TimelineId; projectId: TimelineProjectId; songId: TimelineId; ownerId: TimelineUserId;
  name: string; state: TimelineDawSessionState; revision: number; engineIds: TimelineId[];
  readiness: TimelineDawIntegrationReport; createdAt: string; updatedAt: string; closedAt: string | null;
};
export type TimelineDawSessionEvent = {
  id: TimelineId; sessionId: TimelineId;
  action: "opened" | "validated" | "activated" | "suspended" | "resumed" | "closed";
  revision: number; recordedAt: string; recordedBy: TimelineUserId;
};
export type TimelineDawSessionArchive = { sessions: TimelineDawSession[]; events: TimelineDawSessionEvent[] };

const clone = <T>(value: T): T => structuredClone(value);
const required = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
};

export class TimelineDawSessionCoordinator {
  private readonly sessions = new Map<TimelineId, TimelineDawSession>();
  private readonly events: TimelineDawSessionEvent[] = [];
  private sessionSequence = 0;
  private eventSequence = 0;

  constructor(
    private readonly integration = new TimelineDawSystemIntegrationEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  open(input: {
    projectId: TimelineProjectId; songId: TimelineId; ownerId: TimelineUserId; name: string;
    healthyEngineIds?: Iterable<TimelineId>;
  }): TimelineDawSession {
    const projectId = required(input.projectId, "Project identity");
    const songId = required(input.songId, "Song identity");
    const ownerId = required(input.ownerId, "Owner identity");
    if ([...this.sessions.values()].some((session) =>
      session.projectId === projectId && session.songId === songId &&
      session.ownerId === ownerId && session.state !== "closed"
    )) throw new Error("This owner already has an open DAW session for the song.");
    const readiness = this.integration.report(input.healthyEngineIds);
    const timestamp = this.now().toISOString();
    const session: TimelineDawSession = {
      id: `timeline-daw-session-${++this.sessionSequence}`, projectId, songId, ownerId,
      name: required(input.name, "Session name"), state: readiness.ready ? "ready" : "draft",
      revision: 0, engineIds: [...TIMELINE_DAW_ENGINE_IDS], readiness,
      createdAt: timestamp, updatedAt: timestamp, closedAt: null,
    };
    this.sessions.set(session.id, clone(session));
    this.record(session, "opened", ownerId);
    return clone(session);
  }

  validate(sessionId: TimelineId, expectedRevision: number, actorId: TimelineUserId, healthyEngineIds?: Iterable<TimelineId>): TimelineDawSession {
    const session = this.editable(sessionId, expectedRevision);
    session.readiness = this.integration.report(healthyEngineIds);
    session.state = session.readiness.ready ? "ready" : "draft";
    return this.save(session, "validated", actorId);
  }

  activate(sessionId: TimelineId, expectedRevision: number, actorId: TimelineUserId): TimelineDawSession {
    const session = this.editable(sessionId, expectedRevision);
    if (session.state !== "ready") throw new Error("Only a ready DAW session can be activated.");
    if (!session.readiness.ready) throw new Error("All twelve DAW engines must be ready before activation.");
    session.state = "active";
    return this.save(session, "activated", actorId);
  }

  suspend(sessionId: TimelineId, expectedRevision: number, actorId: TimelineUserId): TimelineDawSession {
    const session = this.editable(sessionId, expectedRevision);
    if (session.state !== "active") throw new Error("Only an active DAW session can be suspended.");
    session.state = "suspended";
    return this.save(session, "suspended", actorId);
  }

  resume(sessionId: TimelineId, expectedRevision: number, actorId: TimelineUserId): TimelineDawSession {
    const session = this.editable(sessionId, expectedRevision);
    if (session.state !== "suspended") throw new Error("Only a suspended DAW session can be resumed.");
    if (!session.readiness.ready) throw new Error("A blocked DAW session cannot resume.");
    session.state = "active";
    return this.save(session, "resumed", actorId);
  }

  close(sessionId: TimelineId, expectedRevision: number, actorId: TimelineUserId): TimelineDawSession {
    const session = this.editable(sessionId, expectedRevision);
    if (!["ready", "active", "suspended"].includes(session.state)) {
      throw new Error("A draft DAW session must validate before it can close.");
    }
    session.state = "closed";
    session.closedAt = this.now().toISOString();
    return this.save(session, "closed", actorId);
  }

  get(sessionId: TimelineId): TimelineDawSession | null { return clone(this.sessions.get(sessionId) ?? null); }
  list(input: { projectId?: TimelineProjectId; songId?: TimelineId; ownerId?: TimelineUserId; includeClosed?: boolean } = {}): TimelineDawSession[] {
    return [...this.sessions.values()]
      .filter((session) => !input.projectId || session.projectId === input.projectId)
      .filter((session) => !input.songId || session.songId === input.songId)
      .filter((session) => !input.ownerId || session.ownerId === input.ownerId)
      .filter((session) => input.includeClosed || session.state !== "closed").map(clone);
  }
  history(sessionId: TimelineId): TimelineDawSessionEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId).map(clone);
  }
  exportArchive(): TimelineDawSessionArchive {
    return { sessions: [...this.sessions.values()].map(clone), events: this.events.map(clone) };
  }
  restoreArchive(archive: TimelineDawSessionArchive): void {
    const sessionIds = new Set<string>();
    for (const session of archive.sessions) {
      if (sessionIds.has(session.id)) throw new Error("DAW session archive contains duplicate session identities.");
      sessionIds.add(session.id);
      if (session.engineIds.length !== TIMELINE_DAW_ENGINE_IDS.length ||
        TIMELINE_DAW_ENGINE_IDS.some((id) => !session.engineIds.includes(id))) {
        throw new Error(`DAW session ${session.id} does not bind all twelve engines.`);
      }
    }
    if (archive.events.some((event) => !sessionIds.has(event.sessionId))) {
      throw new Error("DAW session archive contains an event for an unknown session.");
    }
    this.sessions.clear();
    archive.sessions.forEach((session) => this.sessions.set(session.id, clone(session)));
    this.events.splice(0, this.events.length, ...archive.events.map(clone));
    this.sessionSequence = Math.max(0, ...archive.sessions.map((session) => this.sequence(session.id)));
    this.eventSequence = Math.max(0, ...archive.events.map((event) => this.sequence(event.id)));
  }

  private editable(sessionId: TimelineId, expectedRevision: number): TimelineDawSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`DAW session ${sessionId} was not found.`);
    if (session.state === "closed") throw new Error("Closed DAW sessions are immutable.");
    if (session.revision !== expectedRevision) {
      throw new Error(`DAW session revision conflict: expected ${expectedRevision}, current ${session.revision}.`);
    }
    return clone(session);
  }
  private save(session: TimelineDawSession, action: TimelineDawSessionEvent["action"], actorId: TimelineUserId): TimelineDawSession {
    session.revision += 1;
    session.updatedAt = this.now().toISOString();
    this.sessions.set(session.id, clone(session));
    this.record(session, action, required(actorId, "Actor identity"));
    return clone(session);
  }
  private record(session: TimelineDawSession, action: TimelineDawSessionEvent["action"], actorId: TimelineUserId): void {
    this.events.push({
      id: `timeline-daw-session-event-${++this.eventSequence}`, sessionId: session.id, action,
      revision: session.revision, recordedAt: this.now().toISOString(), recordedBy: actorId,
    });
  }
  private sequence(id: string): number { return Number(id.match(/(\d+)$/)?.[1] ?? 0); }
}

export const timelineDawSessionCoordinator = new TimelineDawSessionCoordinator();
