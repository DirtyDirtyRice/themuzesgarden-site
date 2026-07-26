import { describe, expect, it } from "vitest";
import { TimelineRecordingAndTakeManagementEngine } from "../../lib/timeline/TimelineRecordingAndTakeManagementEngine";

function create(engine: TimelineRecordingAndTakeManagementEngine) {
  return engine.createSession({
    projectId: "project-1",
    songId: "song-1",
    multiTrackSessionId: "session-1",
    transportId: "transport-1",
    name: "Vocal recording",
    sampleRate: 48_000,
    createdBy: "steve",
  });
}

function arm(
  engine: TimelineRecordingAndTakeManagementEngine,
  session: ReturnType<typeof create>,
  trackId = "track-vocal",
) {
  return engine.armTrack({
    sessionId: session.id,
    expectedHead: session.head,
    trackId,
    inputId: `input-${trackId}`,
    channelCount: 1,
    monitoring: "auto",
    armedBy: "steve",
  });
}

function recordTake(
  engine: TimelineRecordingAndTakeManagementEngine,
  session: ReturnType<typeof create>,
  options: { complete?: boolean; trackId?: string; artifactId?: string } = {},
) {
  let current = engine.startRecording({
    sessionId: session.id,
    expectedHead: session.head,
    transportTick: 0,
    transportPlaying: true,
    startedBy: "steve",
  });
  current = engine.commitTake({
    sessionId: current.id,
    expectedHead: current.head,
    startTick: 0,
    endTick: 3_840,
    startSample: 0,
    endSample: 96_000,
    assets: [
      {
        trackId: options.trackId ?? "track-vocal",
        artifactId: options.artifactId ?? "artifact-vocal-1",
        checksum: "sha256-vocal",
        channelCount: 1,
        startSample: 0,
        endSample: 96_000,
      },
    ],
    complete: options.complete,
    recordedBy: "steve",
  });
  return current;
}

describe("TimelineRecordingAndTakeManagementEngine", () => {
  it("records an immutable take, builds a comp, validates, and activates it", () => {
    const engine = new TimelineRecordingAndTakeManagementEngine();
    let current = arm(engine, create(engine));
    current = recordTake(engine, current);
    const take = current.takes[0];
    current = engine.addCompSegment({
      sessionId: current.id,
      expectedHead: current.head,
      takeId: take.id,
      trackId: "track-vocal",
      startTick: 0,
      endTick: 3_840,
      editedBy: "producer",
    });
    current = engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(current.status).toBe("validated");
    current = engine.activate({
      sessionId: current.id,
      expectedHead: current.head,
      activatedBy: "reviewer",
    });
    expect(current.status).toBe("active");
    expect(current.takes[0]).toMatchObject({ lane: 1, complete: true });
  });

  it("enforces punch ranges, transport state, armed inputs, and optimistic heads", () => {
    const engine = new TimelineRecordingAndTakeManagementEngine();
    let current = arm(engine, create(engine));
    current = engine.configureRange({
      sessionId: current.id,
      expectedHead: current.head,
      mode: "punch",
      startTick: 960,
      endTick: 1_920,
      editedBy: "steve",
    });
    expect(() => engine.startRecording({
      sessionId: current.id,
      expectedHead: current.head - 1,
      transportTick: 960,
      transportPlaying: true,
      startedBy: "steve",
    })).toThrow(/head conflict/i);
    expect(() => engine.startRecording({
      sessionId: current.id,
      expectedHead: current.head,
      transportTick: 0,
      transportPlaying: true,
      startedBy: "steve",
    })).toThrow(/outside/i);
    expect(() => engine.startRecording({
      sessionId: current.id,
      expectedHead: current.head,
      transportTick: 960,
      transportPlaying: false,
      startedBy: "steve",
    })).toThrow(/transport must be playing/i);
  });

  it("creates separate loop lanes and preserves every raw take", () => {
    const engine = new TimelineRecordingAndTakeManagementEngine();
    let current = arm(engine, create(engine));
    current = engine.configureRange({
      sessionId: current.id,
      expectedHead: current.head,
      mode: "loop",
      startTick: 0,
      endTick: 3_840,
      loopPassLimit: 2,
      editedBy: "steve",
    });
    current = recordTake(engine, current, { artifactId: "take-1" });
    expect(current).toMatchObject({ status: "draft", currentPass: 1 });
    current = recordTake(engine, current, { artifactId: "take-2" });
    expect(current).toMatchObject({ status: "stopped", currentPass: 2 });
    expect(current.takes.map((take) => take.lane)).toEqual([1, 2]);
    expect(current.takes.map((take) => take.assets[0].artifactId)).toEqual([
      "take-1",
      "take-2",
    ]);
  });

  it("holds incomplete takes and prevents overlapping comp selections", () => {
    const engine = new TimelineRecordingAndTakeManagementEngine();
    let current = arm(engine, create(engine));
    current = recordTake(engine, current, { complete: false });
    const take = current.takes[0];
    current = engine.addCompSegment({
      sessionId: current.id,
      expectedHead: current.head,
      takeId: take.id,
      trackId: "track-vocal",
      startTick: 0,
      endTick: 2_000,
      editedBy: "producer",
    });
    expect(() => engine.addCompSegment({
      sessionId: current.id,
      expectedHead: current.head,
      takeId: take.id,
      trackId: "track-vocal",
      startTick: 1_000,
      endTick: 3_000,
      editedBy: "producer",
    })).toThrow(/cannot overlap/i);
    current = engine.validate({
      sessionId: current.id,
      expectedHead: current.head,
      validatedBy: "reviewer",
    });
    expect(current.status).toBe("held");
    expect(current.issues.some((issue) => issue.code === "take-incomplete")).toBe(true);
  });

  it("archives, restores, and continues stable session, take, comp, and event identities", () => {
    const source = new TimelineRecordingAndTakeManagementEngine();
    let current = arm(source, create(source));
    current = recordTake(source, current);
    current = source.addCompSegment({
      sessionId: current.id,
      expectedHead: current.head,
      takeId: current.takes[0].id,
      trackId: "track-vocal",
      startTick: 0,
      endTick: 3_840,
      editedBy: "producer",
    });
    current = source.archive({
      sessionId: current.id,
      expectedHead: current.head,
      archivedBy: "steve",
    });
    const archive = source.exportArchive();
    const restored = new TimelineRecordingAndTakeManagementEngine();
    restored.restoreArchive(archive);
    expect(restored.getSession(current.id)).toEqual(current);
    const next = arm(restored, create(restored));
    const recorded = recordTake(restored, next);
    expect(next.id).toBe("timeline-recording-session-2");
    expect(recorded.takes[0].id).toBe("timeline-recorded-take-2");
    expect(restored.listEvents().at(-1)?.id).toBe("timeline-recording-event-12");
    expect(() => restored.restoreArchive({
      sessions: [...archive.sessions, ...archive.sessions],
      events: archive.events,
    })).toThrow(/duplicate/i);
  });
});
