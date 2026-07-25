import { describe, expect, it } from "vitest";
import { TimelineNonDestructiveEditingEngine } from "../../lib/timeline/TimelineNonDestructiveEditingEngine";

function setup() {
  const engine = new TimelineNonDestructiveEditingEngine();
  const track = engine.audio.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title: "Lead vocal",
      kind: "audio",
      contentFingerprint: "sha256-original",
    },
    "member-1",
  ).tracks[0];
  const session = engine.createSession({
    trackId: track.id,
    name: "Radio edit",
    createdBy: "member-1",
  });
  return { engine, track, session };
}
const clip = () => ({
  sourceUri: "audio://original.wav",
  sourceFingerprint: "sha256-original",
  timelineStartSeconds: 0,
  sourceStartSeconds: 2,
  durationSeconds: 10,
  gainDb: 0,
  fadeInSeconds: 0.2,
  fadeOutSeconds: 0.5,
  muted: false,
});
function add(engine: TimelineNonDestructiveEditingEngine, sessionId: string) {
  return engine.addClip({
    sessionId,
    expectedCursor: 0,
    clip: clip(),
    editedBy: "member-1",
  });
}
function finish(
  engine: TimelineNonDestructiveEditingEngine,
  sessionId: string,
) {
  engine.queueRender({ sessionId, expectedCursor: 1, requestedBy: "member-1" });
  engine.claimNextRender({ workerId: "worker", leaseMilliseconds: 60_000 });
  return engine.completeRender({
    sessionId,
    workerId: "worker",
    output: {
      uri: "audio://render.wav",
      fingerprint: "sha256-rendered",
      role: "render-output",
    },
  });
}

describe("TimelineNonDestructiveEditingEngine", () => {
  it("keeps source audio protected while edits remain reversible", () => {
    const { engine, track, session } = setup();
    const first = add(engine, session.id);
    const clipId = first.clips[0].id;
    engine.updateClip({
      sessionId: session.id,
      expectedCursor: 1,
      clipId,
      patch: { gainDb: -4 },
      editedBy: "member-1",
    });
    expect(
      engine.undo({
        sessionId: session.id,
        expectedCursor: 2,
        editedBy: "member-1",
      }).clips[0].gainDb,
    ).toBe(0);
    expect(
      engine.redo({
        sessionId: session.id,
        expectedCursor: 1,
        editedBy: "member-1",
      }).clips[0].gainDb,
    ).toBe(-4);
    expect(
      engine.audio.revisions.tracks.getTrack(track.id)?.contentFingerprint,
    ).toBe("sha256-original");
  });

  it("rejects stale editors and incomplete clip instructions", () => {
    const { engine, session } = setup();
    add(engine, session.id);
    expect(() =>
      engine.addClip({
        sessionId: session.id,
        expectedCursor: 0,
        clip: clip(),
        editedBy: "member-2",
      }),
    ).toThrow(/cursor/i);
    expect(() =>
      engine.addClip({
        sessionId: session.id,
        expectedCursor: 1,
        clip: {
          ...clip(),
          durationSeconds: 1,
          fadeInSeconds: 0.75,
          fadeOutSeconds: 0.75,
        },
        editedBy: "member-1",
      }),
    ).toThrow(/fade/i);
  });

  it("holds completed renders for human approval before activation", () => {
    const { engine, track, session } = setup();
    add(engine, session.id);
    expect(finish(engine, session.id).status).toBe("awaiting-review");
    expect(engine.audio.revisions.getActiveRevision(track.id)).toBeNull();
    expect(
      engine.reviewRender({
        sessionId: session.id,
        decision: "accept",
        reviewedBy: "member-2",
      }).status,
    ).toBe("active");
    expect(
      engine.audio.revisions.getActiveRevision(track.id)?.outputFingerprint,
    ).toBe("sha256-rendered");
  });

  it("blocks stale renders when the active track changes during review", () => {
    const { engine, track, session } = setup();
    add(engine, session.id);
    finish(engine, session.id);
    const manual = engine.audio.revisions.createDraft({
      trackId: track.id,
      label: "Manual edit",
      source: "manual-edit",
      outputArtifactUri: "audio://manual.wav",
      outputFingerprint: "sha256-manual",
      createdBy: "member-3",
    }).revision!;
    engine.audio.revisions.addOperation({
      revisionId: manual.id,
      kind: "trim",
      description: "Emergency trim",
      parameters: { startSeconds: 0, endSeconds: 5 },
      createdBy: "member-3",
    });
    engine.audio.revisions.validate({
      revisionId: manual.id,
      validatedBy: "member-3",
    });
    engine.audio.revisions.activate({
      revisionId: manual.id,
      activatedBy: "member-3",
    });
    expect(
      engine.reviewRender({
        sessionId: session.id,
        decision: "accept",
        reviewedBy: "member-2",
      }).status,
    ).toBe("stale");
    expect(engine.audio.revisions.getActiveRevision(track.id)?.id).toBe(
      manual.id,
    );
  });

  it("restores archives with stable identities", () => {
    const { engine, track, session } = setup();
    add(engine, session.id);
    const restored = new TimelineNonDestructiveEditingEngine();
    restored.audio.revisions.tracks.restoreArchive(
      engine.audio.revisions.tracks.exportArchive(),
    );
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getSession(session.id)?.clips).toHaveLength(1);
    expect(
      restored.createSession({
        trackId: track.id,
        name: "Second edit",
        createdBy: "member-1",
      }).id,
    ).toBe("timeline-edit-session-2");
  });
});
