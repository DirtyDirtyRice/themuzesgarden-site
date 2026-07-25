import { describe, expect, it } from "vitest";

import { TimelineMixAutomationEngine } from "../../lib/timeline/TimelineMixAutomationEngine";
import { TimelineMixSessionEngine } from "../../lib/timeline/TimelineMixSessionEngine";

function renderedTrack(
  mixes: TimelineMixSessionEngine,
  title: string,
  fingerprint: string,
) {
  const track = mixes.audio.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title,
      kind: "audio",
      contentFingerprint: fingerprint,
    },
    "member-1",
  ).tracks[0];
  const revision = mixes.audio.revisions.createDraft({
    trackId: track.id,
    label: `${title} source`,
    source: "recording",
    outputArtifactUri: `audio://${track.id}.wav`,
    outputFingerprint: fingerprint,
    createdBy: "member-1",
  }).revision!;
  mixes.audio.revisions.addOperation({
    revisionId: revision.id,
    kind: "annotation",
    description: "Recorded source",
    createdBy: "member-1",
  });
  mixes.audio.revisions.validate({
    revisionId: revision.id,
    validatedBy: "member-1",
  });
  mixes.audio.revisions.activate({
    revisionId: revision.id,
    activatedBy: "member-1",
  });
  return track;
}

function setup() {
  const mixes = new TimelineMixSessionEngine();
  const master = renderedTrack(mixes, "Master", "sha256-master");
  const vocal = renderedTrack(mixes, "Vocal", "sha256-vocal");
  const session = mixes.createSession({
    songId: "song-1",
    masterTrackId: master.id,
    name: "Album mix",
    createdBy: "member-1",
  });
  const withLane = mixes.addLane({
    sessionId: session.id,
    expectedHead: 0,
    trackId: vocal.id,
    editedBy: "member-1",
  });
  const engine = new TimelineMixAutomationEngine(mixes);
  const lane = engine.createLane({
    sessionId: session.id,
    targetKind: "lane",
    targetId: withLane.lanes[0].id,
    parameter: "gainDb",
    minimum: -120,
    maximum: 24,
    defaultValue: 0,
    createdBy: "member-1",
  });
  return { engine, mixes, session: withLane, automation: lane };
}

describe("TimelineMixAutomationEngine", () => {
  it("evaluates deterministic step and linear automation", () => {
    const { engine, automation } = setup();
    const first = engine.addPoint({
      laneId: automation.id,
      expectedHead: 0,
      timeSeconds: 0,
      value: -12,
      curve: "linear",
      editedBy: "member-1",
    });
    engine.addPoint({
      laneId: automation.id,
      expectedHead: 1,
      timeSeconds: 10,
      value: 0,
      editedBy: "member-1",
    });

    expect(first.points).toHaveLength(1);
    expect(engine.evaluate(automation.id, 5)).toBe(-6);
    expect(
      engine.renderEnvelope({
        laneId: automation.id,
        startSeconds: 0,
        endSeconds: 10,
        intervalSeconds: 5,
      }),
    ).toEqual([
      { timeSeconds: 0, value: -12 },
      { timeSeconds: 5, value: -6 },
      { timeSeconds: 10, value: 0 },
    ]);
  });

  it("records write-mode gestures and replaces only their time range", () => {
    const { engine, automation } = setup();
    const writable = engine.updateLane({
      laneId: automation.id,
      expectedHead: 0,
      patch: { writeMode: "write" },
      editedBy: "member-1",
    });
    engine.addPoint({
      laneId: automation.id,
      expectedHead: writable.head,
      timeSeconds: 0,
      value: -10,
      editedBy: "member-1",
    });
    engine.addPoint({
      laneId: automation.id,
      expectedHead: 2,
      timeSeconds: 20,
      value: -2,
      editedBy: "member-1",
    });
    const recorded = engine.recordGesture({
      laneId: automation.id,
      expectedHead: 3,
      samples: [
        { timeSeconds: 5, value: -8 },
        { timeSeconds: 10, value: -4 },
      ],
      recordedBy: "member-1",
    });

    expect(recorded.points.map((point) => point.timeSeconds)).toEqual([
      0, 5, 10, 20,
    ]);
  });

  it("refuses stale editors, duplicate times, and out-of-range values", () => {
    const { engine, automation } = setup();
    engine.addPoint({
      laneId: automation.id,
      expectedHead: 0,
      timeSeconds: 1,
      value: -3,
      editedBy: "member-1",
    });
    expect(() =>
      engine.addPoint({
        laneId: automation.id,
        expectedHead: 0,
        timeSeconds: 2,
        value: -3,
        editedBy: "member-2",
      }),
    ).toThrow(/stale/i);
    expect(() =>
      engine.addPoint({
        laneId: automation.id,
        expectedHead: 1,
        timeSeconds: 1,
        value: -3,
        editedBy: "member-1",
      }),
    ).toThrow(/already exists/i);
    expect(() =>
      engine.addPoint({
        laneId: automation.id,
        expectedHead: 1,
        timeSeconds: 2,
        value: 25,
        editedBy: "member-1",
      }),
    ).toThrow(/between/i);
  });

  it("detects automation and mix changes after a render snapshot", () => {
    const { engine, mixes, session, automation } = setup();
    const snapshot = engine.createSnapshot({
      sessionId: session.id,
      createdBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id)).toEqual({
      valid: true,
      mixChanged: false,
      automationChanged: false,
    });
    engine.addPoint({
      laneId: automation.id,
      expectedHead: 0,
      timeSeconds: 1,
      value: -3,
      editedBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id).automationChanged).toBe(true);

    mixes.addBus({
      sessionId: session.id,
      expectedHead: session.head,
      name: "Reverb",
      kind: "aux",
      editedBy: "member-1",
    });
    expect(engine.verifySnapshot(snapshot.id).mixChanged).toBe(true);
  });

  it("restores stable lane and point identities", () => {
    const { engine, mixes, session, automation } = setup();
    engine.addPoint({
      laneId: automation.id,
      expectedHead: 0,
      timeSeconds: 1,
      value: -3,
      editedBy: "member-1",
    });
    const restored = new TimelineMixAutomationEngine(mixes);
    restored.restoreArchive(engine.exportArchive());
    const next = restored.createLane({
      sessionId: session.id,
      targetKind: "session",
      parameter: "tempo",
      minimum: 20,
      maximum: 300,
      defaultValue: 120,
      createdBy: "member-1",
    });

    expect(restored.getLane(automation.id)?.points[0].id).toBe(
      "timeline-automation-point-1",
    );
    expect(next.id).toBe("timeline-automation-lane-2");
  });
});
