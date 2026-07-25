import { describe, expect, it } from "vitest";

import { TimelineAlbumSetSequencingEngine } from "../../lib/timeline/TimelineAlbumSetSequencingEngine";

function create(engine = new TimelineAlbumSetSequencingEngine()) {
  const sequence = engine.createSequence({
    projectId: "album-1",
    name: "Garden album",
    mode: "album",
    entries: [
      {
        trackId: "track-1",
        title: "Opening",
        durationMs: 180_000,
        boundary: 1,
        transitionAfter: { kind: "gap", durationMs: 2_000 },
        required: true,
      },
      {
        trackId: "track-2",
        title: "Middle",
        durationMs: 210_000,
        boundary: 1,
        transitionAfter: { kind: "hard-cut", durationMs: 0 },
        required: true,
      },
      {
        trackId: "track-3",
        title: "Finale",
        durationMs: 240_000,
        boundary: 2,
        transitionAfter: { kind: "hard-cut", durationMs: 0 },
        required: true,
      },
    ],
    breaks: [
      {
        afterEntryIndex: 1,
        durationMs: 5_000,
        kind: "side-change",
        note: "Turn record over",
      },
    ],
    maximumDurationMs: 700_000,
    createdBy: "producer-1",
  });
  return { engine, sequence };
}

describe("TimelineAlbumSetSequencingEngine", () => {
  it("holds duplicate tracks and missing boundary breaks", () => {
    const engine = new TimelineAlbumSetSequencingEngine();
    const sequence = engine.createSequence({
      projectId: "album-1",
      name: "Broken order",
      mode: "album",
      entries: [
        {
          trackId: "track-1",
          title: "Song",
          durationMs: 100_000,
          boundary: 1,
          transitionAfter: { kind: "hard-cut", durationMs: 0 },
          required: true,
        },
        {
          trackId: "track-1",
          title: "Song again",
          durationMs: 100_000,
          boundary: 2,
          transitionAfter: { kind: "hard-cut", durationMs: 0 },
          required: true,
        },
      ],
      maximumDurationMs: 300_000,
      createdBy: "producer-1",
    });
    const held = engine.submitForApproval({
      sequenceId: sequence.id,
      submittedBy: "producer-1",
    });
    expect(held.status).toBe("held");
    expect(held.issues.join(" ")).toContain("duplicated");
    expect(held.issues.join(" ")).toContain("requires a break");
  });

  it("calculates gaps, crossfades, and breaks exactly", () => {
    const { sequence } = create();
    expect(sequence.calculatedDurationMs).toBe(637_000);
    expect(sequence.issues).toEqual([]);
  });

  it("creates non-destructive sequence revisions", () => {
    const { engine, sequence } = create();
    const revised = engine.revise({
      sequenceId: sequence.id,
      maximumDurationMs: 750_000,
      createdBy: "producer-1",
    });
    expect(revised.parentSequenceId).toBe(sequence.id);
    expect(revised.revision).toBe(2);
    expect(engine.getSequence(sequence.id)?.maximumDurationMs).toBe(700_000);
  });

  it("requires independent approval and keeps one active mode", () => {
    const { engine, sequence } = create();
    engine.submitForApproval({ sequenceId: sequence.id, submittedBy: "producer-1" });
    expect(() =>
      engine.approve({ sequenceId: sequence.id, approvedBy: "producer-1" }),
    ).toThrow("independent");
    engine.approve({ sequenceId: sequence.id, approvedBy: "reviewer-1" });
    expect(engine.activate({ sequenceId: sequence.id, activatedBy: "reviewer-1" }).status).toBe(
      "active",
    );
  });

  it("restores fingerprinted sequences and continues stable identities", () => {
    const { engine, sequence } = create();
    const restored = new TimelineAlbumSetSequencingEngine();
    restored.restoreArchive(engine.exportArchive());
    expect(restored.getSequence(sequence.id)?.fingerprint).toBe(sequence.fingerprint);
    expect(restored.listReceipts()[0].id).toBe("timeline-sequence-receipt-1");
    const next = create(restored).sequence;
    expect(next.id).toBe("timeline-album-set-sequence-2");
    expect(next.entries[0].id).toBe("timeline-sequence-entry-4");
  });
});
