import { describe, expect, it } from "vitest";

import { TimelineMixSessionEngine } from "../../lib/timeline/TimelineMixSessionEngine";

function createRenderedTrack(
  engine: TimelineMixSessionEngine,
  input: { songId: string; title: string; fingerprint: string },
) {
  const track = engine.audio.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: input.songId,
      title: input.title,
      kind: "audio",
      contentFingerprint: input.fingerprint,
    },
    "member-1",
  ).tracks[0];
  const revision = engine.audio.revisions.createDraft({
    trackId: track.id,
    label: `${input.title} source`,
    source: "recording",
    outputArtifactUri: `audio://${track.id}.wav`,
    outputFingerprint: input.fingerprint,
    createdBy: "member-1",
  }).revision!;
  engine.audio.revisions.addOperation({
    revisionId: revision.id,
    kind: "annotation",
    description: "Original recorded source",
    createdBy: "member-1",
  });
  engine.audio.revisions.validate({
    revisionId: revision.id,
    validatedBy: "member-1",
  });
  engine.audio.revisions.activate({
    revisionId: revision.id,
    activatedBy: "member-1",
  });
  return { track, revision };
}

function setup() {
  const engine = new TimelineMixSessionEngine();
  const master = createRenderedTrack(engine, {
    songId: "song-1",
    title: "Master",
    fingerprint: "sha256-master-source",
  });
  const vocal = createRenderedTrack(engine, {
    songId: "song-1",
    title: "Lead Vocal",
    fingerprint: "sha256-vocal",
  });
  const guitar = createRenderedTrack(engine, {
    songId: "song-1",
    title: "Guitar",
    fingerprint: "sha256-guitar",
  });
  const session = engine.createSession({
    songId: "song-1",
    masterTrackId: master.track.id,
    name: "Album mix",
    createdBy: "member-1",
  });
  return { engine, master, vocal, guitar, session };
}

describe("TimelineMixSessionEngine", () => {
  it("builds ordered revision-pinned lanes without copying source audio", () => {
    const { engine, vocal, guitar, session } = setup();
    const first = engine.addLane({
      sessionId: session.id,
      expectedHead: 0,
      trackId: vocal.track.id,
      editedBy: "member-1",
    });
    const second = engine.addLane({
      sessionId: session.id,
      expectedHead: 1,
      trackId: guitar.track.id,
      editedBy: "member-1",
    });
    const reordered = engine.updateLane({
      sessionId: session.id,
      expectedHead: 2,
      laneId: second.lanes[1].id,
      patch: { order: -1, gainDb: -3, pan: 0.25 },
      editedBy: "member-1",
    });

    expect(reordered.lanes.map((lane) => lane.trackId)).toEqual([
      guitar.track.id,
      vocal.track.id,
    ]);
    expect(reordered.lanes[0].revisionId).toBe(guitar.revision.id);
    expect(
      engine.audio.revisions.tracks.getTrack(vocal.track.id)
        ?.contentFingerprint,
    ).toBe("sha256-vocal");
    expect(first.head).toBe(1);
  });

  it("rejects wrong-song tracks, stale editors, and invalid controls", () => {
    const { engine, vocal, session } = setup();
    engine.addLane({
      sessionId: session.id,
      expectedHead: 0,
      trackId: vocal.track.id,
      editedBy: "member-1",
    });
    const other = createRenderedTrack(engine, {
      songId: "song-2",
      title: "Other song",
      fingerprint: "sha256-other",
    });

    expect(() =>
      engine.addLane({
        sessionId: session.id,
        expectedHead: 0,
        trackId: other.track.id,
        editedBy: "member-2",
      }),
    ).toThrow(/stale/i);
    expect(() =>
      engine.addLane({
        sessionId: session.id,
        expectedHead: 1,
        trackId: other.track.id,
        editedBy: "member-1",
      }),
    ).toThrow(/different song/i);
  });

  it("supports group routing and prevents bus cycles", () => {
    const { engine, session } = setup();
    const drums = engine.addBus({
      sessionId: session.id,
      expectedHead: 0,
      name: "Drum group",
      kind: "group",
      editedBy: "member-1",
    });
    const effects = engine.addBus({
      sessionId: session.id,
      expectedHead: 1,
      name: "Reverb",
      kind: "aux",
      outputBusId: drums.buses[1].id,
      editedBy: "member-1",
    });

    expect(() =>
      engine.updateBus({
        sessionId: session.id,
        expectedHead: 2,
        busId: drums.buses[1].id,
        patch: { outputBusId: effects.buses[2].id },
        editedBy: "member-1",
      }),
    ).toThrow(/cycle/i);
  });

  it("holds a completed mixdown until human review activates it", () => {
    const { engine, master, vocal, session } = setup();
    engine.addLane({
      sessionId: session.id,
      expectedHead: 0,
      trackId: vocal.track.id,
      editedBy: "member-1",
    });
    const queued = engine.queueMixdown({
      sessionId: session.id,
      expectedHead: 1,
      requestedBy: "member-1",
    });
    expect(queued.status).toBe("rendering");
    expect(
      engine.claimNextMixdown({
        workerId: "worker-1",
        leaseMilliseconds: 60_000,
      })?.id,
    ).toBe(session.id);
    const completed = engine.completeMixdown({
      sessionId: session.id,
      workerId: "worker-1",
      outputUri: "audio://album-mix.wav",
      outputFingerprint: "sha256-album-mix",
    });
    expect(completed.status).toBe("awaiting-review");
    expect(engine.audio.revisions.getActiveRevision(master.track.id)?.id).toBe(
      master.revision.id,
    );

    const approved = engine.reviewMixdown({
      sessionId: session.id,
      decision: "accept",
      reviewedBy: "member-2",
    });
    expect(approved.status).toBe("active");
    expect(
      engine.audio.revisions.getActiveRevision(master.track.id)
        ?.outputFingerprint,
    ).toBe("sha256-album-mix");
  });

  it("restores snapshots and advances stable IDs", () => {
    const { engine, master, vocal, session } = setup();
    engine.addLane({
      sessionId: session.id,
      expectedHead: 0,
      trackId: vocal.track.id,
      editedBy: "member-1",
    });
    engine.createSnapshot({
      sessionId: session.id,
      expectedHead: 1,
      createdBy: "member-1",
    });
    const restored = new TimelineMixSessionEngine(engine.audio);
    restored.restoreArchive(engine.exportArchive());

    expect(restored.listSnapshots(session.id)).toHaveLength(1);
    expect(
      restored.createSession({
        songId: "song-1",
        masterTrackId: master.track.id,
        name: "Alternate mix",
        createdBy: "member-1",
      }).id,
    ).toBe("timeline-mix-session-2");
  });
});
