import { describe, expect, it } from "vitest";
import { TimelineSongTrackRepositoryEngine } from "../../lib/timeline/TimelineSongTrackRepositoryEngine";
import { TimelineTrackRevisionEngine } from "../../lib/timeline/TimelineTrackRevisionEngine";

function createEngine() {
  const tracks = new TimelineSongTrackRepositoryEngine();
  const track = tracks.createTrack(
    {
      projectId: "project-1",
      songId: "song-1",
      title: "Lead guitar",
      kind: "audio",
      contentFingerprint: "sha256-original",
    },
    "member-1",
  ).tracks[0];
  return { engine: new TimelineTrackRevisionEngine(tracks), track };
}

function createValidatedBase(
  engine: TimelineTrackRevisionEngine,
  trackId: string,
) {
  const draft = engine.createDraft({
    trackId,
    label: "Cleaned guitar",
    source: "manual-edit",
    inputArtifactUri: "audio://original.wav",
    inputFingerprint: "sha256-original",
    outputArtifactUri: "audio://cleaned.wav",
    outputFingerprint: "sha256-cleaned",
    createdBy: "member-1",
  }).revision!;
  engine.addOperation({
    revisionId: draft.id,
    kind: "trim",
    description: "Remove count-in",
    parameters: { startSeconds: 2.4 },
    createdBy: "member-1",
  });
  return engine.validate({
    revisionId: draft.id,
    validatedBy: "member-1",
  }).revision!;
}

describe("TimelineTrackRevisionEngine", () => {
  it("holds incomplete edits and makes validated revision content immutable", () => {
    const { engine, track } = createEngine();
    const draft = engine.createDraft({
      trackId: track.id,
      label: "First edit",
      source: "manual-edit",
      createdBy: "member-1",
    }).revision!;
    const held = engine.validate({
      revisionId: draft.id,
      validatedBy: "member-1",
    });
    engine.updateDraft({
      revisionId: draft.id,
      patch: {
        outputArtifactUri: "audio://edit-1.wav",
        outputFingerprint: "sha256-edit-1",
      },
      updatedBy: "member-1",
    });
    engine.addOperation({
      revisionId: draft.id,
      kind: "gain",
      description: "Raise level",
      parameters: { decibels: 1.5 },
      createdBy: "member-1",
    });
    const validated = engine.validate({
      revisionId: draft.id,
      validatedBy: "reviewer-1",
    });
    const mutation = engine.addOperation({
      revisionId: draft.id,
      kind: "fade",
      description: "Late mutation",
      createdBy: "member-1",
    });
    const activated = engine.activate({
      revisionId: draft.id,
      activatedBy: "member-1",
    });

    expect(held.accepted).toBe(false);
    expect(held.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "output-artifact-required",
        "output-fingerprint-required",
        "operation-required",
      ]),
    );
    expect(validated.accepted).toBe(true);
    expect(validated.revision?.checksum).toHaveLength(8);
    expect(mutation.accepted).toBe(false);
    expect(mutation.issues[0].code).toBe("revision-immutable");
    expect(activated.revision?.state).toBe("active");
  });

  it("requires complete AI prompt provenance before validation", () => {
    const { engine, track } = createEngine();
    const draft = engine.createDraft({
      trackId: track.id,
      label: "AI texture",
      source: "ai-generation",
      outputArtifactUri: "audio://ai-texture.wav",
      outputFingerprint: "sha256-ai-texture",
      createdBy: "member-1",
    }).revision!;
    engine.addOperation({
      revisionId: draft.id,
      kind: "prompt",
      description: "Generate neutral harmonic texture",
      parameters: { intensity: 0.4 },
      createdBy: "member-1",
    });
    const held = engine.validate({
      revisionId: draft.id,
      validatedBy: "member-1",
    });
    engine.updateDraft({
      revisionId: draft.id,
      patch: {
        aiPrompt: {
          prompt: "Neutral glassy harmonic texture",
          provider: "approved-provider",
          model: "licensed-audio-model",
          requestId: "request-101",
          seed: "44",
          generatedAt: "2026-07-24T12:00:00.000Z",
        },
      },
      updatedBy: "member-1",
    });
    const accepted = engine.validate({
      revisionId: draft.id,
      validatedBy: "reviewer-1",
    });

    expect(held.accepted).toBe(false);
    expect(held.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "ai-prompt-required",
        "ai-provider-required",
        "ai-model-required",
        "ai-request-required",
      ]),
    );
    expect(accepted.accepted).toBe(true);
  });

  it("branches from the active revision and compares only new processing", () => {
    const { engine, track } = createEngine();
    const base = createValidatedBase(engine, track.id);
    engine.activate({ revisionId: base.id, activatedBy: "member-1" });
    const branch = engine.createDraft({
      trackId: track.id,
      branchName: "bright-option",
      label: "Brighter guitar",
      description: "Alternative EQ",
      source: "processing",
      outputArtifactUri: "audio://bright.wav",
      outputFingerprint: "sha256-bright",
      createdBy: "member-1",
    }).revision!;
    engine.addOperation({
      revisionId: branch.id,
      kind: "equalizer",
      description: "Add presence",
      parameters: { frequencyHz: 3200, gainDb: 2 },
      createdBy: "member-1",
    });
    const validated = engine.validate({
      revisionId: branch.id,
      validatedBy: "reviewer-1",
    }).revision!;
    engine.activate({ revisionId: branch.id, activatedBy: "member-1" });
    const comparison = engine.compare(base.id, branch.id);

    expect(branch.parentRevisionId).toBe(base.id);
    expect(branch.operations).toHaveLength(1);
    expect(validated.operations).toHaveLength(2);
    expect(comparison.operationsUnchanged).toBe(1);
    expect(comparison.operationsAdded).toHaveLength(1);
    expect(comparison.operationsAdded[0].kind).toBe("equalizer");
    expect(engine.getRevision(base.id)?.state).toBe("superseded");
    expect(engine.getActiveRevision(track.id)?.id).toBe(branch.id);
  });

  it("protects active work while keeping superseded revisions recoverable", () => {
    const { engine, track } = createEngine();
    const base = createValidatedBase(engine, track.id);
    engine.activate({ revisionId: base.id, activatedBy: "member-1" });
    const activeTrash = engine.moveToTrash({
      revisionId: base.id,
      deletedBy: "member-1",
    });
    const recording = engine.createDraft({
      trackId: track.id,
      label: "Replacement take",
      source: "recording",
      outputArtifactUri: "audio://replacement.wav",
      outputFingerprint: "sha256-replacement",
      createdBy: "member-1",
    }).revision!;
    engine.validate({ revisionId: recording.id, validatedBy: "reviewer-1" });
    engine.activate({ revisionId: recording.id, activatedBy: "member-1" });
    const trashed = engine.moveToTrash({
      revisionId: base.id,
      deletedBy: "member-1",
    });
    const restored = engine.restoreFromTrash({
      revisionId: base.id,
      restoredBy: "member-1",
    });

    expect(activeTrash.accepted).toBe(false);
    expect(activeTrash.issues[0].code).toBe("active-revision-trash");
    expect(trashed.revision?.state).toBe("trash");
    expect(restored.revision?.state).toBe("draft");
    expect(restored.revision?.source).toBe("restoration");
    expect(restored.revision?.checksum).toBeUndefined();
  });

  it("restores tracks, revisions, active heads, and unique IDs after restart", () => {
    const { engine, track } = createEngine();
    const base = createValidatedBase(engine, track.id);
    engine.activate({ revisionId: base.id, activatedBy: "member-1" });
    const archive = engine.exportArchive();
    const restarted = new TimelineTrackRevisionEngine();
    restarted.restoreArchive(archive);
    const child = restarted.createDraft({
      trackId: track.id,
      label: "Post-restart edit",
      source: "processing",
      outputArtifactUri: "audio://post-restart.wav",
      outputFingerprint: "sha256-post-restart",
      createdBy: "member-1",
    }).revision!;

    expect(restarted.getActiveRevision(track.id)?.id).toBe(base.id);
    expect(restarted.tracks.getTrack(track.id)?.id).toBe(track.id);
    expect(child.id).toBe("timeline-track-revision-2");
    expect(child.parentRevisionId).toBe(base.id);
    expect(child.operations[0].id).toBe("timeline-track-operation-1");

    const tampered = structuredClone(archive);
    tampered.revisions[0].label = "Tampered label";
    expect(() =>
      new TimelineTrackRevisionEngine().restoreArchive(tampered),
    ).toThrow("checksum verification");
  });
});
