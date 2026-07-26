import {
  TimelineDawSessionCoordinator,
  type TimelineDawSession,
} from "./TimelineDawSessionCoordinator";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";
import {
  TimelineTransportAndSynchronizationEngine,
  type TimelineTransportEvent,
  type TimelineTransportSynchronization,
} from "./TimelineTransportAndSynchronizationEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineDawTransportCommand =
  | {
      action: "initialize";
      sessionId: TimelineId;
      expectedWorkspaceRevision: number;
    }
  | {
      action: "play";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
    }
  | {
      action: "pause";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      tick?: number;
    }
  | {
      action: "stop";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      returnToTick?: number;
    }
  | {
      action: "locate";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      tick: number;
    }
  | {
      action: "set-loop";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      enabled: boolean;
      startTick: number;
      endTick: number;
    }
  | {
      action: "set-count-in";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      bars: number;
    }
  | {
      action: "complete-count-in";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
    }
  | {
      action: "set-metronome";
      sessionId: TimelineId;
      expectedTransportHead: number;
      expectedWorkspaceRevision: number;
      enabled: boolean;
    };

export type TimelineDawTransportSnapshot = {
  workspaceRevision: number;
  session: TimelineDawSession;
  transport: TimelineTransportSynchronization | null;
  events: TimelineTransportEvent[];
};

export type TimelineDawTransportReceipt = TimelineDawTransportSnapshot & {
  action: TimelineDawTransportCommand["action"];
};

export class TimelineDawTransportService {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly store: TimelineDawWorkspaceStore) {}

  snapshot(actorId: TimelineUserId, sessionId: TimelineId): Promise<TimelineDawTransportSnapshot> {
    return this.queue.then(() => this.load(actorId, sessionId));
  }

  execute(
    command: TimelineDawTransportCommand,
    actorId: TimelineUserId,
  ): Promise<TimelineDawTransportReceipt> {
    const operation = this.queue.then(() => this.executeSerial(command, actorId));
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async load(
    actorId: TimelineUserId,
    sessionId: TimelineId,
  ): Promise<TimelineDawTransportSnapshot> {
    const document = await this.store.load();
    if (!document) throw new Error("DAW workspace was not found.");
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(sessionId);
    if (!session || session.ownerId !== actorId) {
      throw new Error("DAW transport access is limited to its session owner.");
    }
    const engine = new TimelineTransportAndSynchronizationEngine();
    const archive = document.archive.transports?.[sessionId];
    if (archive) engine.restoreArchive(archive);
    const transport = archive?.transports[0] ?? null;
    return {
      workspaceRevision: document.revision,
      session,
      transport,
      events: transport ? engine.listEvents(transport.id) : [],
    };
  }

  private async executeSerial(
    command: TimelineDawTransportCommand,
    actorId: TimelineUserId,
  ): Promise<TimelineDawTransportReceipt> {
    const document = await this.store.load();
    if (!document) throw new Error("DAW workspace was not found.");
    if (document.revision !== command.expectedWorkspaceRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${command.expectedWorkspaceRevision}, current ${document.revision}.`,
      );
    }
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(command.sessionId);
    if (!session || session.ownerId !== actorId) {
      throw new Error("Only the DAW session owner can operate its transport.");
    }
    const engine = new TimelineTransportAndSynchronizationEngine();
    const existing = document.archive.transports?.[session.id];
    if (existing) engine.restoreArchive(existing);
    let transport = existing?.transports[0] ?? null;
    if (command.action === "initialize") {
      if (transport) throw new Error("DAW session transport is already initialized.");
      transport = engine.createTransport({
        projectId: session.projectId,
        sessionId: session.id,
        audioGraphId: `daw-audio-graph-${session.id}`,
        name: `${session.name} transport`,
        sampleRate: 48_000,
        ppq: 960,
        bpm: 120,
        createdBy: actorId,
      });
      transport = engine.validate({
        transportId: transport.id,
        expectedHead: transport.head,
        validatedBy: actorId,
      });
      transport = engine.activate({
        transportId: transport.id,
        expectedHead: transport.head,
        activatedBy: actorId,
      });
    } else {
      if (!transport) throw new Error("DAW session transport is not initialized.");
      if (session.state !== "active") throw new Error("DAW session must be active before operating its transport.");
      const common = {
        transportId: transport.id,
        expectedHead: command.expectedTransportHead,
      };
      if (command.action === "play") {
        transport = engine.play({ ...common, playedBy: actorId });
      } else if (command.action === "pause") {
        if (command.tick !== undefined) {
          transport = engine.locate({
            ...common,
            tick: command.tick,
            locatedBy: actorId,
          });
          common.expectedHead = transport.head;
        }
        transport = engine.pause({ ...common, pausedBy: actorId });
      } else if (command.action === "stop") {
        transport = engine.stop({
          ...common,
          returnToTick: command.returnToTick,
          stoppedBy: actorId,
        });
      } else if (command.action === "locate") {
        transport = engine.locate({ ...common, tick: command.tick, locatedBy: actorId });
      } else if (command.action === "set-loop") {
        transport = engine.setLoop({
          ...common,
          enabled: command.enabled,
          startTick: command.startTick,
          endTick: command.endTick,
          editedBy: actorId,
        });
      } else if (command.action === "set-count-in") {
        transport = engine.setCountIn({
          ...common,
          bars: command.bars,
          editedBy: actorId,
        });
      } else if (command.action === "complete-count-in") {
        transport = engine.completeCountIn({
          ...common,
          completedBy: actorId,
        });
      } else {
        transport = engine.setMetronome({
          ...common,
          enabled: command.enabled,
          editedBy: actorId,
        });
      }
    }
    const nextRevision = document.revision + 1;
    const nextArchive = {
      ...document.archive,
      transports: {
        ...document.archive.transports,
        [session.id]: engine.exportArchive(),
      },
    };
    await this.store.save({
      revision: nextRevision,
      archive: nextArchive,
      updatedAt: new Date().toISOString(),
    }, document.revision);
    return {
      action: command.action,
      workspaceRevision: nextRevision,
      session,
      transport,
      events: engine.listEvents(transport.id),
    };
  }
}
