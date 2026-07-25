import { describe, expect, it } from "vitest";
import { TimelinePromptToTrackGenerationEngine } from "../../lib/timeline/TimelinePromptToTrackGenerationEngine";

function setup(clearRights = true) {
  const engine = new TimelinePromptToTrackGenerationEngine();
  const track = engine.audio.revisions.tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title: "AI texture",
      kind: "audio",
      contentFingerprint: "sha256-empty-track",
    },
    "member-1",
  ).tracks[0];
  const rights = engine.rights.registerIngredient({
    projectId: "project-1",
    ingredient: {
      id: "ingredient-ai-1",
      name: "Approved model output",
      kind: "ai-generated",
      percentage: 100,
      sourceDescription: "Generated with an approved licensed model.",
      owner: "member-1",
      rightsStatus: "cleared",
      contentFingerprint: "sha256-model-terms",
      generatedModel: "licensed-audio-model",
      createdAt: "2026-07-24T12:00:00.000Z",
      createdBy: "member-1",
    },
    registeredBy: "member-1",
  });
  if (clearRights) {
    for (const kind of [
      "clearance",
      "model-terms",
      "fingerprint-verification",
    ] as const) {
      engine.rights.addEvidence({
        recordId: rights.id,
        kind,
        reference: `${kind}-reference`,
        issuer: "Muzes rights review",
        fingerprint:
          kind === "fingerprint-verification"
            ? "sha256-model-terms"
            : undefined,
        addedBy: "member-1",
      });
    }
    engine.rights.review({
      recordId: rights.id,
      reviewedBy: "member-1",
    });
  }
  return { engine, track, rights };
}

function request(
  engine: TimelinePromptToTrackGenerationEngine,
  trackId: string,
  rightsRecordId: string,
) {
  return engine.request({
    projectId: "project-1",
    trackId,
    rightsRecordId,
    prompt:
      "Create a restrained glassy guitar texture without artist imitation",
    provider: "approved-provider",
    model: "licensed-audio-model",
    requestId: "provider-request-101",
    seed: "44",
    requestedBy: "member-1",
  });
}

function generate(
  engine: TimelinePromptToTrackGenerationEngine,
  workflowId: string,
) {
  const running = engine.claimNext({
    workerId: "audio-worker-1",
    leaseMilliseconds: 60_000,
  });
  expect(running?.id).toBe(workflowId);
  return engine.complete({
    workflowId,
    workerId: "audio-worker-1",
    output: {
      uri: "audio://generated-guitar.wav",
      fingerprint: "sha256-generated-guitar",
      role: "generated-master",
    },
  });
}

describe("TimelinePromptToTrackGenerationEngine", () => {
  it("holds generation before creating a job when rights are incomplete", () => {
    const { engine, track, rights } = setup(false);
    const workflow = request(engine, track.id, rights.id);

    expect(workflow.status).toBe("held-rights");
    expect(workflow.revisionId).toBeNull();
    expect(workflow.jobId).toBeNull();
    expect(
      engine.claimNext({ workerId: "worker", leaseMilliseconds: 1_000 }),
    ).toBeNull();
  });

  it("queues cleared prompts and keeps generated audio in human review", () => {
    const { engine, track, rights } = setup();
    const workflow = request(engine, track.id, rights.id);

    expect(workflow.status).toBe("queued");
    expect(workflow.revisionId).toBeTruthy();
    expect(workflow.jobId).toBeTruthy();

    const generated = generate(engine, workflow.id);
    expect(generated.status).toBe("awaiting-review");
    expect(engine.audio.revisions.getActiveRevision(track.id)).toBeNull();
    expect(
      engine.audio.revisions.getRevision(workflow.revisionId!)
        ?.outputFingerprint,
    ).toBe("sha256-generated-guitar");
  });

  it("activates only after a human approval and a second rights check", () => {
    const { engine, track, rights } = setup();
    const workflow = request(engine, track.id, rights.id);
    generate(engine, workflow.id);
    const approved = engine.review({
      workflowId: workflow.id,
      decision: "accept",
      reviewedBy: "member-1",
    });

    expect(approved.status).toBe("active");
    expect(engine.audio.revisions.getActiveRevision(track.id)?.id).toBe(
      workflow.revisionId,
    );
    expect(engine.receiptHistory().map((receipt) => receipt.outcome)).toEqual([
      "queued",
      "generated",
      "activated",
    ]);
  });

  it("refuses stale generated output after the track changes", () => {
    const { engine, track, rights } = setup();
    const workflow = request(engine, track.id, rights.id);
    generate(engine, workflow.id);
    const manual = engine.audio.revisions.createDraft({
      trackId: track.id,
      label: "New human recording",
      source: "recording",
      outputArtifactUri: "audio://human.wav",
      outputFingerprint: "sha256-human",
      createdBy: "member-1",
    }).revision!;
    engine.audio.revisions.addOperation({
      revisionId: manual.id,
      kind: "trim",
      description: "Trim recording",
      createdBy: "member-1",
    });
    engine.audio.revisions.validate({
      revisionId: manual.id,
      validatedBy: "member-1",
    });
    engine.audio.revisions.activate({
      revisionId: manual.id,
      activatedBy: "member-1",
    });
    const reviewed = engine.review({
      workflowId: workflow.id,
      decision: "accept",
      reviewedBy: "member-1",
    });

    expect(reviewed.status).toBe("stale");
    expect(engine.audio.revisions.getActiveRevision(track.id)?.id).toBe(
      manual.id,
    );
  });

  it("holds generated output when rights are revoked before approval", () => {
    const { engine, track, rights } = setup();
    const workflow = request(engine, track.id, rights.id);
    generate(engine, workflow.id);
    engine.rights.revoke({
      recordId: rights.id,
      revokedBy: "rights-reviewer-1",
      reason: "Provider terms changed before activation.",
    });
    const reviewed = engine.review({
      workflowId: workflow.id,
      decision: "accept",
      reviewedBy: "member-1",
    });

    expect(reviewed.status).toBe("held-rights");
    expect(engine.audio.revisions.getActiveRevision(track.id)).toBeNull();
  });

  it("restores workflows, jobs, rights, receipts, and stable IDs", () => {
    const { engine, track, rights } = setup();
    const workflow = request(engine, track.id, rights.id);
    const restarted = new TimelinePromptToTrackGenerationEngine();
    restarted.restoreArchive(engine.exportArchive());
    const next = request(restarted, track.id, rights.id);

    expect(next.id).toBe("timeline-prompt-track-workflow-2");
    expect(restarted.getWorkflow(workflow.id)?.jobId).toBe(workflow.jobId);
    expect(restarted.receiptHistory()).toHaveLength(2);
    expect(() =>
      restarted.restoreArchive({
        ...engine.exportArchive(),
        workflows: [workflow, workflow],
      }),
    ).toThrow("Duplicate prompt-to-track workflow ID");
  });
});
