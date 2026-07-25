import { describe, expect, it } from "vitest";

import { TimelineMasteringEngine } from "../../lib/timeline/TimelineMasteringEngine";

function setup() {
  const engine = new TimelineMasteringEngine();
  const mixes = engine.evaluations.mixes;
  const makeTrack = (title: string) => {
    const track = mixes.audio.revisions.tracks.createTrack(
      {
        projectId: "project-1",
        songId: "song-1",
        title,
        kind: "audio",
        contentFingerprint: `sha256-${title}`,
      },
      "member-1",
    ).tracks[0];
    const revision = mixes.audio.revisions.createDraft({
      trackId: track.id,
      label: `${title} source`,
      source: "recording",
      outputArtifactUri: `audio://${title}.wav`,
      outputFingerprint: `sha256-${title}`,
      createdBy: "member-1",
    }).revision!;
    mixes.audio.revisions.addOperation({
      revisionId: revision.id,
      kind: "annotation",
      description: "Source",
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
  };
  const master = makeTrack("master");
  const vocal = makeTrack("vocal");
  const created = mixes.createSession({
    songId: "song-1",
    masterTrackId: master.id,
    name: "Final mix",
    createdBy: "member-1",
  });
  const mixA = mixes.addLane({
    sessionId: created.id,
    expectedHead: 0,
    trackId: vocal.id,
    editedBy: "member-1",
  });
  const snapshotA = mixes.createSnapshot({
    sessionId: mixA.id,
    expectedHead: mixA.head,
    createdBy: "member-1",
  });
  const mixB = mixes.updateLane({
    sessionId: mixA.id,
    expectedHead: mixA.head,
    laneId: mixA.lanes[0].id,
    patch: { gainDb: -1 },
    editedBy: "member-1",
  });
  const snapshotB = mixes.createSnapshot({
    sessionId: mixB.id,
    expectedHead: mixB.head,
    createdBy: "member-1",
  });
  const comparison = engine.evaluations.createComparison({
    sessionId: created.id,
    name: "Final A/B",
    createdBy: "member-1",
  });
  const a = engine.evaluations.addCandidate({
    comparisonId: comparison.id,
    snapshotId: snapshotA.id,
    label: "A",
    createdBy: "member-1",
  });
  const b = engine.evaluations.addCandidate({
    comparisonId: comparison.id,
    snapshotId: snapshotB.id,
    label: "B",
    createdBy: "member-1",
  });
  const metrics = {
    integratedLufs: -14,
    truePeakDbtp: -1.2,
    loudnessRangeLu: 8,
    stereoCorrelation: 0.8,
    clippedSampleCount: 0,
  };
  engine.evaluations.recordAnalysis({
    candidateId: a.id,
    metrics,
    analyzerId: "analyzer-1",
  });
  engine.evaluations.recordAnalysis({
    candidateId: b.id,
    metrics: { ...metrics, integratedLufs: -15 },
    analyzerId: "analyzer-1",
  });
  engine.evaluations.choosePreferred({
    comparisonId: comparison.id,
    candidateId: a.id,
    decidedBy: "member-2",
    reason: "Best translation.",
  });
  return { engine, comparison, candidate: a, metrics };
}

describe("TimelineMasteringEngine", () => {
  it("holds, approves, validates, and delivers a non-destructive master", () => {
    const { engine, comparison, candidate, metrics } = setup();
    const job = engine.createJob({
      comparisonId: comparison.id,
      target: "streaming",
      createdBy: "member-2",
    });
    expect(job.status).toBe("held");
    expect(job.sourceSnapshotId).toBe(candidate.snapshotId);
    expect(job.sourceSnapshotChecksum).toBe(candidate.snapshotChecksum);
    engine.approve({ jobId: job.id, approvedBy: "member-3" });
    const rendered = engine.submitRender({
      jobId: job.id,
      outputUri: "audio://master.wav",
      outputFingerprint: "sha256-master",
      outputMetrics: metrics,
      sampleRateHz: 48_000,
      bitDepth: 24,
      format: "wav",
      renderedBy: "master-worker",
    });
    expect(rendered.status).toBe("awaiting-review");
    const delivered = engine.review({
      jobId: job.id,
      decision: "accept",
      reviewedBy: "member-4",
      reason: "Approved after listening on three systems.",
    });
    expect(delivered.status).toBe("delivered");
    expect(engine.listReceipts(job.id).map((item) => item.action)).toEqual([
      "created",
      "approved",
      "rendered",
      "delivered",
    ]);
  });

  it("refuses mastering before a human chooses an eligible mix", () => {
    const { engine } = setup();
    const collecting = engine.evaluations.createComparison({
      sessionId: engine.evaluations.mixes.listSnapshots(
        engine.evaluations.getComparison("timeline-mix-comparison-1")!.sessionId,
      )[0].sessionId,
      name: "Undecided",
      createdBy: "member-1",
    });
    expect(() =>
      engine.createJob({
        comparisonId: collecting.id,
        target: "streaming",
        createdBy: "member-1",
      }),
    ).toThrow("decided mix comparison");
  });

  it("fails unsafe or incorrectly formatted renders before review", () => {
    const { engine, comparison, metrics } = setup();
    const job = engine.createJob({
      comparisonId: comparison.id,
      target: "streaming",
      createdBy: "member-2",
    });
    engine.approve({ jobId: job.id, approvedBy: "member-3" });
    const failed = engine.submitRender({
      jobId: job.id,
      outputUri: "audio://bad.mp3",
      outputFingerprint: "sha256-bad",
      outputMetrics: {
        ...metrics,
        integratedLufs: -8,
        truePeakDbtp: 0.5,
        clippedSampleCount: 20,
      },
      sampleRateHz: 44_100,
      bitDepth: 16,
      format: "mp3",
      renderedBy: "master-worker",
    });
    expect(failed.status).toBe("failed");
    expect(failed.issues.length).toBeGreaterThanOrEqual(6);
    expect(() =>
      engine.review({
        jobId: job.id,
        decision: "accept",
        reviewedBy: "member-4",
        reason: "No",
      }),
    ).toThrow("validated master");
  });

  it("requires limiting and final dither for a 16-bit CD plan", () => {
    const { engine, comparison } = setup();
    expect(() =>
      engine.createJob({
        comparisonId: comparison.id,
        target: "compact-disc",
        createdBy: "member-2",
        steps: [
          {
            kind: "equalization",
            description: "Tone",
            parameters: {},
          },
        ],
      }),
    ).toThrow("limiting");
    const job = engine.createJob({
      comparisonId: comparison.id,
      target: "compact-disc",
      createdBy: "member-2",
    });
    expect(job.steps.at(-1)?.kind).toBe("dither");
  });

  it("restores permanent evidence and continues stable job identities", () => {
    const { engine, comparison } = setup();
    const job = engine.createJob({
      comparisonId: comparison.id,
      target: "high-resolution",
      createdBy: "member-2",
    });
    const restored = new TimelineMasteringEngine(engine.evaluations);
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getJob(job.id)?.sourceSnapshotChecksum).toBe(
      job.sourceSnapshotChecksum,
    );
    expect(restored.listReceipts()[0].id).toBe(
      "timeline-mastering-receipt-1",
    );
  });
});
