import { describe, expect, it } from "vitest";

import {
  TimelineMixEvaluationEngine,
  type TimelineMixMetrics,
} from "../../lib/timeline/TimelineMixEvaluationEngine";

function setup() {
  const engine = new TimelineMixEvaluationEngine();
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
  const created = engine.mixes.createSession({
    songId: "song-1",
    masterTrackId: master.id,
    name: "Album mix",
    createdBy: "member-1",
  });
  const firstMix = engine.mixes.addLane({
    sessionId: created.id,
    expectedHead: 0,
    trackId: vocal.id,
    editedBy: "member-1",
  });
  const first = engine.mixes.createSnapshot({
    sessionId: firstMix.id,
    expectedHead: firstMix.head,
    createdBy: "member-1",
  });
  const secondMix = engine.mixes.updateLane({
    sessionId: firstMix.id,
    expectedHead: firstMix.head,
    laneId: firstMix.lanes[0].id,
    patch: { gainDb: -2 },
    editedBy: "member-1",
  });
  const second = engine.mixes.createSnapshot({
    sessionId: secondMix.id,
    expectedHead: secondMix.head,
    createdBy: "member-1",
  });
  const comparison = engine.createComparison({
    sessionId: created.id,
    name: "Vocal balance",
    createdBy: "member-1",
  });
  const candidateA = engine.addCandidate({
    comparisonId: comparison.id,
    snapshotId: first.id,
    label: "Original",
    createdBy: "member-1",
  });
  const candidateB = engine.addCandidate({
    comparisonId: comparison.id,
    snapshotId: second.id,
    label: "Vocal trim",
    createdBy: "member-1",
  });
  return { engine, comparison, candidateA, candidateB, first };
}

const good: TimelineMixMetrics = {
  integratedLufs: -14,
  truePeakDbtp: -1.2,
  loudnessRangeLu: 8,
  stereoCorrelation: 0.7,
  clippedSampleCount: 0,
};

describe("TimelineMixEvaluationEngine", () => {
  it("ranks fully analyzed candidates and preserves a human decision", () => {
    const { engine, comparison, candidateA, candidateB } = setup();
    engine.recordAnalysis({
      candidateId: candidateA.id,
      metrics: { ...good, integratedLufs: -18 },
      analyzerId: "analyzer-1",
    });
    engine.recordAnalysis({
      candidateId: candidateB.id,
      metrics: good,
      analyzerId: "analyzer-1",
    });
    expect(engine.getComparison(comparison.id)?.status).toBe("ready");
    expect(engine.rankCandidates(comparison.id)[0].id).toBe(candidateB.id);
    const decided = engine.choosePreferred({
      comparisonId: comparison.id,
      candidateId: candidateB.id,
      decidedBy: "member-2",
      reason: "Best vocal balance without clipping.",
    });
    expect(decided.status).toBe("decided");
    expect(decided.preferredCandidateId).toBe(candidateB.id);
    expect(engine.listReceipts(comparison.id).at(-1)?.action).toBe("preferred");
  });

  it("disqualifies clipped, peak-unsafe, and phase-unsafe evidence", () => {
    const { engine, candidateA } = setup();
    const result = engine.recordAnalysis({
      candidateId: candidateA.id,
      metrics: {
        ...good,
        truePeakDbtp: 0.2,
        stereoCorrelation: -0.2,
        clippedSampleCount: 12,
      },
      analyzerId: "analyzer-1",
    });
    expect(result.status).toBe("disqualified");
    expect(result.score).toBeUndefined();
    expect(result.issues).toHaveLength(3);
  });

  it("requires complete analysis, two candidates, and a human reason", () => {
    const { engine, comparison, candidateA, candidateB } = setup();
    engine.recordAnalysis({
      candidateId: candidateA.id,
      metrics: good,
      analyzerId: "analyzer-1",
    });
    expect(() =>
      engine.choosePreferred({
        comparisonId: comparison.id,
        candidateId: candidateA.id,
        decidedBy: "member-2",
        reason: "Preferred",
      }),
    ).toThrow("Every candidate");
    engine.recordAnalysis({
      candidateId: candidateB.id,
      metrics: good,
      analyzerId: "analyzer-1",
    });
    expect(() =>
      engine.choosePreferred({
        comparisonId: comparison.id,
        candidateId: candidateA.id,
        decidedBy: "member-2",
        reason: " ",
      }),
    ).toThrow("reason");
  });

  it("rejects cross-session and duplicate mix snapshots", () => {
    const { engine, comparison, first } = setup();
    expect(() =>
      engine.addCandidate({
        comparisonId: comparison.id,
        snapshotId: first.id,
        label: "Duplicate",
        createdBy: "member-1",
      }),
    ).toThrow("exact mix state");
    const otherMaster = engine.mixes.audio.revisions.tracks.createTrack(
      {
        projectId: "project-2",
        songId: "song-2",
        title: "Other",
        kind: "audio",
        contentFingerprint: "sha256-other",
      },
      "member-1",
    ).tracks[0];
    const otherSession = engine.mixes.createSession({
      songId: "song-2",
      masterTrackId: otherMaster.id,
      name: "Other",
      createdBy: "member-1",
    });
    expect(() =>
      engine.addCandidate({
        comparisonId: comparison.id,
        snapshotId: `missing-${otherSession.id}`,
        label: "Wrong",
        createdBy: "member-1",
      }),
    ).toThrow("not found in this mix session");
  });

  it("restores evidence and continues stable identities", () => {
    const { engine, comparison, candidateA } = setup();
    engine.recordAnalysis({
      candidateId: candidateA.id,
      metrics: good,
      analyzerId: "analyzer-1",
    });
    const restored = new TimelineMixEvaluationEngine(engine.mixes);
    restored.restoreArchive(engine.exportArchive());
    expect(restored.listCandidates(comparison.id)[0].score).toBeDefined();
    expect(restored.listReceipts()[0].id).toBe(
      "timeline-mix-evaluation-receipt-1",
    );
  });
});
