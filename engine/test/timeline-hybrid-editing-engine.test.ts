import { describe, expect, it } from "vitest";
import { TimelineHybridEditingEngine } from "../../lib/timeline/TimelineHybridEditingEngine";

function setup() {
  const engine = new TimelineHybridEditingEngine();
  const track = engine.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title: "Lead guitar",
      kind: "audio",
      contentFingerprint: "sha256-original",
    },
    "member-1",
  ).tracks[0];
  const session = engine.openSession({
    songId: "song-1",
    name: "Album edit",
    openedBy: "member-1",
  });
  return { engine, track, session };
}

function humanEdit(
  engine: TimelineHybridEditingEngine,
  sessionId: string,
  trackId: string,
  expectedActiveRevisionId: string | null,
  fingerprint = "sha256-human",
) {
  return engine.applyHumanEdit({
    sessionId,
    trackId,
    expectedActiveRevisionId,
    label: "Human guitar edit",
    outputArtifactUri: `audio://${fingerprint}.wav`,
    outputFingerprint: fingerprint,
    operations: [
      {
        kind: "trim",
        description: "Tighten the entrance",
        parameters: { startSeconds: 1.2 },
      },
    ],
    editedBy: "member-1",
  });
}

function aiProposal(
  engine: TimelineHybridEditingEngine,
  sessionId: string,
  trackId: string,
) {
  return engine.proposeAIEdit({
    sessionId,
    trackId,
    label: "AI guitar texture",
    outputArtifactUri: "audio://ai-guitar.wav",
    outputFingerprint: "sha256-ai-guitar",
    prompt: {
      prompt: "Add a restrained glassy guitar texture",
      provider: "approved-provider",
      model: "licensed-audio-model",
      requestId: "request-101",
      generatedAt: "2026-07-24T12:00:00.000Z",
    },
    operations: [
      {
        kind: "prompt",
        description: "Generate guitar texture",
        parameters: { intensity: 0.35 },
      },
    ],
    proposedBy: "assistant-1",
  });
}

describe("TimelineHybridEditingEngine", () => {
  it("activates a complete human DAW edit and records its receipt", () => {
    const { engine, track, session } = setup();
    const receipt = humanEdit(engine, session.id, track.id, null);

    expect(receipt.outcome).toBe("activated");
    expect(receipt.source).toBe("human");
    expect(engine.revisions.getActiveRevision(track.id)?.id).toBe(
      receipt.revisionId,
    );
    expect(engine.receiptHistory(session.id)).toEqual([receipt]);
  });

  it("holds an AI edit until review and activates it after approval", () => {
    const { engine, track, session } = setup();
    const base = humanEdit(engine, session.id, track.id, null);
    const proposal = aiProposal(engine, session.id, track.id);

    expect(proposal.status).toBe("held");
    expect(engine.revisions.getActiveRevision(track.id)?.id).toBe(
      base.revisionId,
    );

    const receipt = engine.reviewAIEdit({
      proposalId: proposal.id,
      decision: "accept",
      reviewedBy: "member-1",
    });
    expect(receipt.outcome).toBe("activated");
    expect(receipt.beforeRevisionId).toBe(base.revisionId);
    expect(engine.getProposal(proposal.id)?.status).toBe("accepted");
    expect(engine.revisions.getActiveRevision(track.id)?.source).toBe(
      "ai-generation",
    );
  });

  it("refuses a stale AI proposal after a human changes the track", () => {
    const { engine, track, session } = setup();
    const base = humanEdit(engine, session.id, track.id, null);
    const proposal = aiProposal(engine, session.id, track.id);
    const human = humanEdit(
      engine,
      session.id,
      track.id,
      base.revisionId!,
      "sha256-new-human",
    );
    const receipt = engine.reviewAIEdit({
      proposalId: proposal.id,
      decision: "accept",
      reviewedBy: "member-1",
    });

    expect(receipt.outcome).toBe("stale");
    expect(engine.getProposal(proposal.id)?.status).toBe("stale");
    expect(engine.revisions.getActiveRevision(track.id)?.id).toBe(
      human.revisionId,
    );
  });

  it("keeps incomplete AI output blocked instead of activating it", () => {
    const { engine, track, session } = setup();
    const proposal = engine.proposeAIEdit({
      sessionId: session.id,
      trackId: track.id,
      label: "Incomplete AI edit",
      outputArtifactUri: "",
      outputFingerprint: "",
      prompt: {
        prompt: "",
        provider: "",
        model: "",
        requestId: "",
        generatedAt: "2026-07-24T12:00:00.000Z",
      },
      operations: [],
      proposedBy: "assistant-1",
    });
    const receipt = engine.reviewAIEdit({
      proposalId: proposal.id,
      decision: "accept",
      reviewedBy: "member-1",
    });

    expect(receipt.outcome).toBe("blocked");
    expect(receipt.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "output-artifact-required",
        "output-fingerprint-required",
        "operation-required",
        "ai-prompt-required",
        "ai-provider-required",
        "ai-model-required",
        "ai-request-required",
      ]),
    );
    expect(engine.getProposal(proposal.id)?.status).toBe("blocked");
    expect(engine.revisions.getActiveRevision(track.id)).toBeNull();
  });

  it("restores hybrid history and continues stable identities", () => {
    const { engine, track, session } = setup();
    humanEdit(engine, session.id, track.id, null);
    aiProposal(engine, session.id, track.id);
    const restarted = new TimelineHybridEditingEngine();
    restarted.restoreArchive(engine.exportArchive());
    const nextSession = restarted.openSession({
      songId: "song-1",
      name: "Next",
      openedBy: "member-1",
    });
    const nextProposal = aiProposal(restarted, nextSession.id, track.id);

    expect(nextSession.id).toBe("timeline-hybrid-session-2");
    expect(nextProposal.id).toBe("timeline-hybrid-proposal-2");
    expect(restarted.receiptHistory()).toHaveLength(1);
    expect(() =>
      restarted.restoreArchive({
        ...engine.exportArchive(),
        sessions: [session, session],
      }),
    ).toThrow("Duplicate hybrid session ID");
  });
});
