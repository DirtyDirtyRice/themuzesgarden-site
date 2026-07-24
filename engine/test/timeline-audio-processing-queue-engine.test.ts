import { describe, expect, it } from "vitest";
import { TimelineAudioProcessingQueueEngine } from "../../lib/timeline/TimelineAudioProcessingQueueEngine";
import { TimelineSongTrackRepositoryEngine } from "../../lib/timeline/TimelineSongTrackRepositoryEngine";
import {
  TimelineTrackRevisionEngine,
  type TimelineTrackRevisionSource,
} from "../../lib/timeline/TimelineTrackRevisionEngine";

function createQueue(now: () => Date = () => new Date()) {
  const tracks = new TimelineSongTrackRepositoryEngine();
  const revisions = new TimelineTrackRevisionEngine(tracks);
  const track = tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title: "Processing track",
      kind: "audio",
    },
    "member-1",
  ).tracks[0];
  return {
    queue: new TimelineAudioProcessingQueueEngine(revisions, now),
    revisions,
    track,
  };
}

function createDraft(
  revisions: TimelineTrackRevisionEngine,
  trackId: string,
  source: TimelineTrackRevisionSource = "processing",
  aiPrompt = false,
) {
  const revision = revisions.createDraft({
    trackId,
    label: `${source} revision`,
    source,
    inputArtifactUri: "audio://source.wav",
    inputFingerprint: "sha256-source",
    aiPrompt: aiPrompt
      ? {
          prompt: "Neutral harmonic texture",
          provider: "approved-provider",
          model: "licensed-model",
          requestId: "request-1",
          generatedAt: "2026-07-24T12:00:00.000Z",
        }
      : undefined,
    createdBy: "member-1",
  }).revision!;
  revisions.addOperation({
    revisionId: revision.id,
    kind: source === "ai-generation" ? "prompt" : "equalizer",
    description: "Requested processing",
    createdBy: "member-1",
  });
  return revision;
}

function createRenderJob(
  queue: TimelineAudioProcessingQueueEngine,
  revisionId: string,
  options: {
    dependencies?: string[];
    priority?: number;
    maxAttempts?: number;
  } = {},
) {
  return queue.createJob({
    revisionId,
    kind: "render",
    inputs: [
      {
        uri: "audio://source.wav",
        fingerprint: "sha256-source",
        role: "source",
      },
    ],
    outputSpecification: {
      format: "wav",
      sampleRate: 48_000,
      bitDepth: 24,
      channels: 2,
    },
    dependencyJobIds: options.dependencies,
    priority: options.priority,
    maxAttempts: options.maxAttempts,
    createdBy: "member-1",
  }).job!;
}

describe("TimelineAudioProcessingQueueEngine", () => {
  it("holds malformed jobs before they can enter the worker queue", () => {
    const { queue, revisions, track } = createQueue();
    const draft = createDraft(revisions, track.id);
    const missingInput = queue.createJob({
      revisionId: draft.id,
      kind: "render",
      outputSpecification: { format: "wav" },
      createdBy: "member-1",
    });
    const invalidOutput = queue.createJob({
      revisionId: draft.id,
      kind: "render",
      inputs: [{ uri: "audio://source.wav", fingerprint: "", role: "source" }],
      outputSpecification: { format: "wav", sampleRate: 400 },
      createdBy: "member-1",
    });

    expect(missingInput.accepted).toBe(false);
    expect(missingInput.issues.map((issue) => issue.code)).toContain(
      "input-required",
    );
    expect(invalidOutput.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "input-fingerprint-required",
        "output-specification-invalid",
      ]),
    );
    expect(queue.statistics().held).toBe(0);
  });

  it("runs dependencies in order and attaches verified outputs to revisions", () => {
    const { queue, revisions, track } = createQueue();
    const firstRevision = createDraft(revisions, track.id);
    const secondRevision = createDraft(revisions, track.id);
    const first = createRenderJob(queue, firstRevision.id);
    const second = createRenderJob(queue, secondRevision.id, {
      dependencies: [first.id],
      priority: 100,
    });
    queue.enqueue({ jobId: first.id, queuedBy: "member-1" });
    queue.enqueue({ jobId: second.id, queuedBy: "member-1" });
    const firstClaim = queue.claimNext({
      workerId: "worker-1",
      leaseMilliseconds: 60_000,
    })!;
    queue.complete({
      jobId: firstClaim.id,
      workerId: "worker-1",
      output: {
        uri: "audio://first-render.wav",
        fingerprint: "sha256-first-render",
        role: "render",
      },
    });
    const secondClaim = queue.claimNext({
      workerId: "worker-2",
      leaseMilliseconds: 60_000,
    })!;

    expect(firstClaim.id).toBe(first.id);
    expect(secondClaim.id).toBe(second.id);
    expect(revisions.getRevision(firstRevision.id)).toMatchObject({
      outputArtifactUri: "audio://first-render.wav",
      outputFingerprint: "sha256-first-render",
    });
    expect(queue.statistics()).toMatchObject({
      running: 1,
      succeeded: 1,
    });
  });

  it("enforces worker leases and recovers abandoned jobs for retry", () => {
    let current = new Date("2026-07-24T12:00:00.000Z");
    const { queue, revisions, track } = createQueue(() => current);
    const draft = createDraft(revisions, track.id);
    const job = createRenderJob(queue, draft.id, { maxAttempts: 2 });
    queue.enqueue({ jobId: job.id, queuedBy: "member-1" });
    queue.claimNext({ workerId: "worker-1", leaseMilliseconds: 1_000 });
    const intruder = queue.complete({
      jobId: job.id,
      workerId: "worker-2",
      output: {
        uri: "audio://wrong-worker.wav",
        fingerprint: "sha256-wrong",
        role: "render",
      },
    });
    current = new Date("2026-07-24T12:00:02.000Z");
    const recovered = queue.recoverExpiredLeases("queue-recovery");
    const retry = queue.claimNext({
      workerId: "worker-3",
      leaseMilliseconds: 1_000,
    })!;
    current = new Date("2026-07-24T12:00:04.000Z");
    const exhausted = queue.recoverExpiredLeases("queue-recovery")[0];

    expect(intruder.accepted).toBe(false);
    expect(intruder.issues[0].code).toBe("lease-owner-mismatch");
    expect(recovered[0].state).toBe("queued");
    expect(retry.attempts).toHaveLength(2);
    expect(exhausted.state).toBe("failed");
    expect(exhausted.attempts.at(-1)?.outcome).toBe("lease-expired");
  });

  it("requires AI provenance and propagates cancelled dependencies", () => {
    const { queue, revisions, track } = createQueue();
    const incompleteAI = createDraft(
      revisions,
      track.id,
      "ai-generation",
      false,
    );
    const refused = queue.createJob({
      revisionId: incompleteAI.id,
      kind: "ai-generate",
      outputSpecification: { format: "wav" },
      createdBy: "member-1",
    });
    const completeAI = createDraft(revisions, track.id, "ai-generation", true);
    const parent = queue.createJob({
      revisionId: completeAI.id,
      kind: "ai-generate",
      outputSpecification: { format: "wav" },
      createdBy: "member-1",
    }).job!;
    const dependentDraft = createDraft(revisions, track.id);
    const dependent = createRenderJob(queue, dependentDraft.id, {
      dependencies: [parent.id],
    });
    queue.enqueue({ jobId: parent.id, queuedBy: "member-1" });
    queue.enqueue({ jobId: dependent.id, queuedBy: "member-1" });
    queue.cancel({
      jobId: parent.id,
      cancelledBy: "member-1",
      reason: "User rejected the generated direction.",
    });

    expect(refused.accepted).toBe(false);
    expect(refused.issues[0].code).toBe("ai-provenance-required");
    expect(queue.getJob(parent.id)?.state).toBe("cancelled");
    expect(queue.getJob(dependent.id)?.state).toBe("failed");
    expect(
      queue.claimNext({ workerId: "worker-1", leaseMilliseconds: 1_000 }),
    ).toBeNull();
  });

  it("restores running work and continues job IDs after a restart", () => {
    let current = new Date("2026-07-24T12:00:00.000Z");
    const { queue, revisions, track } = createQueue(() => current);
    const draft = createDraft(revisions, track.id);
    const job = createRenderJob(queue, draft.id);
    queue.enqueue({ jobId: job.id, queuedBy: "member-1" });
    queue.claimNext({ workerId: "worker-1", leaseMilliseconds: 1_000 });
    const archive = queue.exportArchive();
    const restarted = new TimelineAudioProcessingQueueEngine(
      undefined,
      () => current,
    );
    restarted.restoreArchive(archive);
    current = new Date("2026-07-24T12:00:02.000Z");
    const recovered = restarted.recoverExpiredLeases("restart-recovery")[0];
    const nextDraft = createDraft(restarted.revisions, track.id);
    const nextJob = createRenderJob(restarted, nextDraft.id);

    expect(recovered.id).toBe(job.id);
    expect(recovered.state).toBe("queued");
    expect(restarted.revisions.getRevision(draft.id)?.id).toBe(draft.id);
    expect(nextJob.id).toBe("timeline-audio-job-2");
  });
});
