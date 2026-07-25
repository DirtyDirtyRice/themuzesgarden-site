import { describe, expect, it } from "vitest";

import { AIMixAssistantEngine } from "../../lib/timeline/AIMixAssistantEngine";

function setup() {
  const engine = new AIMixAssistantEngine();
  const makeTrack = (title: string) => {
    const track = engine.mixes.audio.revisions.tracks.createTrack(
      {
        projectId: "project-1",
        songId: "song-1",
        title,
        kind: "audio",
        contentFingerprint: `sha256-${title}`,
      },
      "member-1",
    ).tracks[0];
    const revision = engine.mixes.audio.revisions.createDraft({
      trackId: track.id,
      label: `${title} source`,
      source: "recording",
      outputArtifactUri: `audio://${title}.wav`,
      outputFingerprint: `sha256-${title}`,
      createdBy: "member-1",
    }).revision!;
    engine.mixes.audio.revisions.addOperation({
      revisionId: revision.id,
      kind: "annotation",
      description: "Source",
      createdBy: "member-1",
    });
    engine.mixes.audio.revisions.validate({
      revisionId: revision.id,
      validatedBy: "member-1",
    });
    engine.mixes.audio.revisions.activate({
      revisionId: revision.id,
      activatedBy: "member-1",
    });
    return track;
  };
  const master = makeTrack("master");
  const vocal = makeTrack("vocal");
  const session = engine.mixes.createSession({
    songId: "song-1",
    masterTrackId: master.id,
    name: "Mix",
    createdBy: "member-1",
  });
  const mixed = engine.mixes.addLane({
    sessionId: session.id,
    expectedHead: 0,
    trackId: vocal.id,
    editedBy: "member-1",
  });
  const rack = engine.effects.createRack({
    sessionId: mixed.id,
    targetKind: "lane",
    targetId: mixed.lanes[0].id,
    createdBy: "member-1",
  });
  const withEffect = engine.effects.addEffect({
    rackId: rack.id,
    expectedHead: 0,
    definitionId: "garden.compressor",
    editedBy: "member-1",
  });
  const automation = engine.automation.createLane({
    sessionId: mixed.id,
    targetKind: "lane",
    targetId: mixed.lanes[0].id,
    parameter: "gainDb",
    minimum: -120,
    maximum: 24,
    defaultValue: 0,
    createdBy: "member-1",
  });
  return {
    engine,
    session: mixed,
    lane: mixed.lanes[0],
    rack: withEffect,
    effect: withEffect.effects[0],
    automation,
  };
}

describe("AIMixAssistantEngine", () => {
  it("holds valid AI advice until a human applies every action", () => {
    const { engine, session, lane, rack, effect, automation } = setup();
    const proposal = engine.propose({
      sessionId: session.id,
      summary: "Control vocal dynamics",
      confidence: 0.91,
      actions: [
        {
          kind: "update-lane",
          laneId: lane.id,
          patch: { gainDb: -2 },
          reason: "Vocal is louder than the reference.",
        },
        {
          kind: "update-effect",
          rackId: rack.id,
          effectId: effect.id,
          patch: { parameters: { ratio: 6 } },
          reason: "Reduce peak variation.",
        },
        {
          kind: "add-automation-point",
          automationLaneId: automation.id,
          timeSeconds: 12,
          value: -3,
          reason: "Tame the loud phrase.",
        },
      ],
      evidence: [
        {
          source: "loudness-analysis",
          measuredAt: new Date().toISOString(),
          metrics: { peakDb: -0.5, rangeDb: 14 },
        },
      ],
      createdBy: "ai-worker",
    });
    expect(proposal.status).toBe("held");
    expect(engine.mixes.getSession(session.id)?.lanes[0].gainDb).toBe(0);

    const result = engine.review({
      proposalId: proposal.id,
      decision: "accept",
      reviewedBy: "member-2",
    });
    expect(result.receipt.appliedActionCount).toBe(3);
    expect(engine.mixes.getSession(session.id)?.lanes[0].gainDb).toBe(-2);
    expect(engine.effects.getRack(rack.id)?.effects[0].parameters.ratio).toBe(
      6,
    );
    expect(engine.automation.getLane(automation.id)?.points[0].value).toBe(-3);
  });

  it("blocks invalid AI output before review", () => {
    const { engine, session } = setup();
    const proposal = engine.propose({
      sessionId: session.id,
      summary: "Invalid guess",
      confidence: 0.4,
      actions: [
        {
          kind: "update-lane",
          laneId: "invented-lane",
          patch: { gainDb: 90 },
          reason: "",
        },
      ],
      createdBy: "ai-worker",
    });
    expect(proposal.status).toBe("blocked");
    expect(proposal.issues.length).toBeGreaterThanOrEqual(3);
    expect(engine.listReceipts(session.id)[0].outcome).toBe("blocked");
  });

  it("marks approved advice stale when the mix changes first", () => {
    const { engine, session, lane } = setup();
    const proposal = engine.propose({
      sessionId: session.id,
      summary: "Lower vocal",
      confidence: 0.8,
      actions: [
        {
          kind: "update-lane",
          laneId: lane.id,
          patch: { gainDb: -2 },
          reason: "Balance.",
        },
      ],
      createdBy: "ai-worker",
    });
    engine.mixes.updateLane({
      sessionId: session.id,
      expectedHead: session.head,
      laneId: lane.id,
      patch: { gainDb: -1 },
      editedBy: "member-1",
    });
    const result = engine.review({
      proposalId: proposal.id,
      decision: "accept",
      reviewedBy: "member-2",
    });
    expect(result.proposal.status).toBe("stale");
    expect(engine.mixes.getSession(session.id)?.lanes[0].gainDb).toBe(-1);
  });

  it("records a human rejection without changing the mix", () => {
    const { engine, session, lane } = setup();
    const proposal = engine.propose({
      sessionId: session.id,
      summary: "Pan vocal",
      confidence: 0.7,
      actions: [
        {
          kind: "update-lane",
          laneId: lane.id,
          patch: { pan: 0.4 },
          reason: "Create space.",
        },
      ],
      createdBy: "ai-worker",
    });
    const result = engine.review({
      proposalId: proposal.id,
      decision: "reject",
      reviewedBy: "member-2",
      reason: "Keep the lead centered.",
    });
    expect(result.receipt.outcome).toBe("rejected");
    expect(engine.mixes.getSession(session.id)?.lanes[0].pan).toBe(0);
  });

  it("restores proposals and continues stable receipt identities", () => {
    const { engine, session, lane } = setup();
    const proposal = engine.propose({
      sessionId: session.id,
      summary: "Small trim",
      confidence: 0.6,
      actions: [
        {
          kind: "update-lane",
          laneId: lane.id,
          patch: { gainDb: -1 },
          reason: "Balance.",
        },
      ],
      createdBy: "ai-worker",
    });
    engine.review({
      proposalId: proposal.id,
      decision: "reject",
      reviewedBy: "member-2",
    });
    const restored = new AIMixAssistantEngine(
      engine.mixes,
      engine.effects,
      engine.automation,
    );
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getProposal(proposal.id)?.status).toBe("rejected");
    expect(restored.listReceipts()[0].id).toBe("ai-mix-receipt-1");
  });
});
